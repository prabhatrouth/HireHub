import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

export const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName || !companyName.trim()) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false,
            });
        }

        // Check sub-user permission (Allow if either canManageCompanies or canPostJobs is granted)
        let currentUser = null;
        if (isDbConnected()) {
            if (mongoose.Types.ObjectId.isValid(req.id)) {
                currentUser = await User.findById(req.id).catch(() => null);
            }
        } else {
            currentUser = mockStore.users.find((u) => String(u._id) === String(req.id));
        }

        if (currentUser?.isSubUser && !currentUser?.permissions?.canManageCompanies && !currentUser?.permissions?.canPostJobs) {
            return res.status(403).json({
                message: "Access Denied: Your account does not have permission to register companies. Please contact your lead recruiter to grant 'canManageCompanies' or 'canPostJobs' permission.",
                success: false,
            });
        }

        const trimmedName = companyName.trim();

        if (isDbConnected()) {
            const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            let existingCompany = await Company.findOne({
                name: { $regex: new RegExp(`^${escapedName}$`, "i") },
            });

            if (existingCompany) {
                // If it already belongs to this user or admin, allow continuing setup smoothly
                if (String(existingCompany.userId) === String(req.id)) {
                    return res.status(200).json({
                        message: "Company already registered by you. Proceeding to setup...",
                        company: existingCompany,
                        success: true,
                    });
                }
                return res.status(400).json({
                    message: `A company named "${trimmedName}" is already registered. Please choose a unique name (e.g. ${trimmedName} Technologies or ${trimmedName} HQ).`,
                    success: false,
                });
            }

            let validUserId = req.id;
            if (!mongoose.Types.ObjectId.isValid(validUserId)) {
                // If user is from mock or custom id, find or fallback to an existing recruiter user id
                const foundUser = await User.findById(validUserId).catch(() => null);
                if (!foundUser) {
                    const fallbackUser = await User.findOne({ role: { $in: ["recruiter", "admin"] } });
                    validUserId = fallbackUser ? fallbackUser._id : new mongoose.Types.ObjectId();
                }
            }

            const company = await Company.create({
                name: trimmedName,
                userId: validUserId,
            });

            // Keep mockStore synced
            mockStore.companies.push({
                _id: String(company._id),
                name: company.name,
                description: company.description || "",
                website: company.website || "",
                location: company.location || "",
                logo: company.logo || "",
                userId: String(validUserId),
                createdAt: company.createdAt || new Date().toISOString(),
            });

            return res.status(201).json({
                message: "Company registered successfully.",
                company,
                success: true,
            });
        } else {
            const existing = mockStore.companies.find(
                (c) => c.name?.toLowerCase() === trimmedName.toLowerCase()
            );
            if (existing) {
                if (String(existing.userId) === String(req.id) || req.id === "recruiter_1") {
                    return res.status(200).json({
                        message: "Company already registered by you. Proceeding to setup...",
                        company: existing,
                        success: true,
                    });
                }
                return res.status(400).json({
                    message: `A company named "${trimmedName}" already exists. Please choose a unique name.`,
                    success: false,
                });
            }
            const newCompany = {
                _id: `company_${Date.now()}`,
                name: trimmedName,
                description: "",
                website: "",
                location: "",
                logo: "",
                userId: req.id || "recruiter_1",
                createdAt: new Date().toISOString(),
            };
            mockStore.companies.unshift(newCompany);
            return res.status(201).json({
                message: "Company registered successfully.",
                company: newCompany,
                success: true,
            });
        }
    } catch (error) {
        console.error("Register Company Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to register company.",
            success: false,
        });
    }
};

export const getCompany = async (req, res) => {
    try {
        const userId = req.id; // logged in user id

        let currentUser = null;
        let isAdminUser = false;
        if (isDbConnected()) {
            if (mongoose.Types.ObjectId.isValid(userId)) {
                currentUser = await User.findById(userId).populate("profile.company").catch(() => null);
                if (currentUser?.role === "admin") isAdminUser = true;
            }
        } else {
            currentUser = mockStore.users.find((u) => String(u._id) === String(userId));
            if (currentUser?.role === "admin") isAdminUser = true;
        }

        // If sub-user, retrieve companies owned by the parent recruiter or team
        let parentId = currentUser?.isSubUser
            ? (currentUser.parentRecruiter?._id || currentUser.parentRecruiter)
            : null;

        let parentRecruiterUser = null;

        // Auto-heal: If isSubUser but parentId is not set directly on currentUser, find recruiter who owns this sub-user
        if (currentUser?.isSubUser && !parentId) {
            if (isDbConnected()) {
                parentRecruiterUser = await User.findOne({
                    $or: [
                        { "subUsers.userId": currentUser._id },
                        { "subUsers.email": currentUser.email?.toLowerCase() },
                    ],
                });
                if (parentRecruiterUser) {
                    parentId = parentRecruiterUser._id;
                    currentUser.parentRecruiter = parentRecruiterUser._id;
                    await currentUser.save().catch(() => null);
                }
            } else {
                parentRecruiterUser = mockStore.users.find((u) =>
                    u.subUsers?.some(
                        (s) =>
                            String(s.userId) === String(userId) ||
                            s.email?.toLowerCase() === currentUser.email?.toLowerCase()
                    )
                );
                if (parentRecruiterUser) {
                    parentId = parentRecruiterUser._id;
                    currentUser.parentRecruiter = parentRecruiterUser._id;
                }
            }
        }

        const effectiveRecruiterId = parentId || userId;

        if (isDbConnected()) {
            const teamUserIds = [userId, effectiveRecruiterId];
            if (currentUser?.isSubUser && parentId) {
                const siblings = await User.find({ parentRecruiter: parentId }).select("_id");
                siblings.forEach((s) => teamUserIds.push(s._id));
            } else if (!currentUser?.isSubUser) {
                const subUsers = await User.find({ parentRecruiter: userId }).select("_id");
                subUsers.forEach((s) => teamUserIds.push(s._id));
                if (currentUser?.subUsers && currentUser.subUsers.length > 0) {
                    currentUser.subUsers.forEach((s) => {
                        if (s.userId) teamUserIds.push(s.userId);
                    });
                }
            }

            const objectIds = [];
            const stringIds = [];
            teamUserIds.forEach((id) => {
                if (!id) return;
                stringIds.push(String(id));
                if (mongoose.Types.ObjectId.isValid(id)) {
                    objectIds.push(new mongoose.Types.ObjectId(id));
                }
            });

            // Also check profile.company of user and parent
            const profileCompanyIds = [];
            if (currentUser?.profile?.company) {
                profileCompanyIds.push(currentUser.profile.company._id || currentUser.profile.company);
            }
            if (parentRecruiterUser?.profile?.company) {
                profileCompanyIds.push(parentRecruiterUser.profile.company._id || parentRecruiterUser.profile.company);
            }

            const profileCompanyObjectIds = [];
            profileCompanyIds.forEach((cId) => {
                if (cId && mongoose.Types.ObjectId.isValid(cId)) {
                    profileCompanyObjectIds.push(new mongoose.Types.ObjectId(cId));
                }
            });

            const orConditions = [
                { userId: { $in: objectIds } },
                { userId: { $in: stringIds } },
            ];

            if (profileCompanyObjectIds.length > 0) {
                orConditions.push({ _id: { $in: profileCompanyObjectIds } });
            }

            const query = isAdminUser ? {} : { $or: orConditions };
            let companies = await Company.find(query).sort({ createdAt: -1 });

            // If still no company found and this is a sub-user, check if any companies belong to the parent recruiter or team
            if ((!companies || companies.length === 0) && currentUser?.isSubUser) {
                const fallbackCompanies = await Company.find({
                    $or: [
                        { userId: effectiveRecruiterId },
                        { userId: String(effectiveRecruiterId) },
                    ],
                });
                if (fallbackCompanies && fallbackCompanies.length > 0) {
                    companies = fallbackCompanies;
                }
            }

            return res.status(200).json({
                companies: companies || [],
                success: true,
            });
        } else {
            const teamIds = [String(userId), String(effectiveRecruiterId)];
            if (currentUser?.isSubUser && parentId) {
                mockStore.users
                    .filter((u) => String(u.parentRecruiter) === String(parentId))
                    .forEach((u) => teamIds.push(String(u._id)));
            } else if (!currentUser?.isSubUser) {
                mockStore.users
                    .filter((u) => String(u.parentRecruiter) === String(userId))
                    .forEach((u) => teamIds.push(String(u._id)));
                currentUser?.subUsers?.forEach((s) => {
                    if (s.userId) teamIds.push(String(s.userId));
                });
            }

            let userCompanies = mockStore.companies.filter(
                (c) =>
                    isAdminUser ||
                    teamIds.includes(String(c.userId)) ||
                    userId === "recruiter_1" ||
                    (currentUser?.isSubUser && String(c.userId) === "recruiter_1") ||
                    String(effectiveRecruiterId) === "recruiter_1"
            );

            // Sub-users with job posting should never be stranded without access to demo companies
            if (userCompanies.length === 0 && currentUser?.isSubUser) {
                userCompanies = mockStore.companies;
            }

            return res.status(200).json({
                companies: userCompanies,
                success: true,
            });
        }
    } catch (error) {
        console.error("Get Company Error:", error);
        return res.status(200).json({
            companies: mockStore.companies || [],
            success: true,
        });
    }
};

// get company by id
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;

        if (isDbConnected() && mongoose.Types.ObjectId.isValid(companyId)) {
            const company = await Company.findById(companyId);
            if (company) {
                return res.status(200).json({
                    company,
                    success: true,
                });
            }
        }

        // Search mockStore or string ID
        const company = mockStore.companies.find((c) => String(c._id) === String(companyId));
        if (company) {
            return res.status(200).json({
                company,
                success: true,
            });
        }

        return res.status(404).json({
            message: "Company not found.",
            success: false,
        });
    } catch (error) {
        console.error("Get Company By Id Error:", error);
        const company = mockStore.companies.find((c) => String(c._id) === String(req.params.id));
        if (company) {
            return res.status(200).json({ company, success: true });
        }
        return res.status(404).json({
            message: "Company not found.",
            success: false,
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        // Sub-user permission check
        let currentUser = null;
        if (isDbConnected()) {
            if (mongoose.Types.ObjectId.isValid(req.id)) {
                currentUser = await User.findById(req.id).catch(() => null);
            }
        } else {
            currentUser = mockStore.users.find((u) => String(u._id) === String(req.id));
        }

        if (currentUser?.isSubUser && !currentUser?.permissions?.canManageCompanies) {
            return res.status(403).json({
                message: "Access Denied: Your sub-user account does not have permission to edit company profiles.",
                success: false,
            });
        }

        const { name, description, website, location } = req.body;
        const file = req.file;

        let logo = undefined;
        if (file && process.env.CLOUD_NAME && process.env.API_KEY) {
            try {
                const fileUri = getDataUri(file);
                const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
                logo = cloudResponse.secure_url;
            } catch (cErr) {
                console.warn("Cloudinary company logo upload failed:", cErr.message);
            }
        }

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        if (website !== undefined) updateData.website = website;
        if (location !== undefined) updateData.location = location;
        if (logo) updateData.logo = logo;

        if (isDbConnected() && mongoose.Types.ObjectId.isValid(req.params.id)) {
            const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });
            if (company) {
                const mIdx = mockStore.companies.findIndex((c) => String(c._id) === String(company._id));
                if (mIdx !== -1) {
                    mockStore.companies[mIdx] = { ...mockStore.companies[mIdx], ...updateData };
                }
                return res.status(200).json({
                    message: "Company information updated successfully.",
                    company,
                    success: true,
                });
            }
        }

        const mockCompany = mockStore.companies.find((c) => String(c._id) === String(req.params.id));
        if (mockCompany) {
            if (name) mockCompany.name = name.trim();
            if (description !== undefined) mockCompany.description = description;
            if (website !== undefined) mockCompany.website = website;
            if (location !== undefined) mockCompany.location = location;
            if (logo) mockCompany.logo = logo;

            return res.status(200).json({
                message: "Company information updated successfully.",
                company: mockCompany,
                success: true,
            });
        }

        return res.status(404).json({
            message: "Company not found.",
            success: false,
        });
    } catch (error) {
        console.error("Update Company Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to update company.",
            success: false,
        });
    }
};
