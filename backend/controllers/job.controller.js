import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

// admin post krega job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || experience === undefined || !position || !companyId) {
            return res.status(400).json({
                message: "Something is missing.",
                success: false,
            });
        }

        // Sub-user permission check for posting jobs
        let currentUser = null;
        if (isDbConnected()) {
            if (mongoose.Types.ObjectId.isValid(userId)) {
                currentUser = await User.findById(userId).catch(() => null);
            }
        } else {
            currentUser = mockStore.users.find((u) => String(u._id) === String(userId));
        }

        if (currentUser?.isSubUser && !currentUser?.permissions?.canPostJobs) {
            return res.status(403).json({
                message: "Access Denied: Your account does not have permission to post jobs. Your lead recruiter has restricted job postings for your account.",
                success: false,
            });
        }

        const reqsArray = typeof requirements === "string" ? requirements.split(",").map((r) => r.trim()) : requirements;

        if (isDbConnected()) {
            const job = await Job.create({
                title,
                description,
                requirements: reqsArray,
                salary: Number(salary),
                location,
                jobType,
                experienceLevel: Number(experience) || 0,
                position: Number(position) || 1,
                company: companyId,
                created_by: userId,
            });
            const populatedJob = await Job.findById(job._id).populate({ path: "company" });
            return res.status(201).json({
                message: "New job created successfully.",
                job: populatedJob || job,
                success: true,
            });
        } else {
            const company = mockStore.companies.find((c) => String(c._id) === String(companyId)) || {
                _id: companyId,
                name: "Tech Solutions",
                location,
            };
            const newJob = {
                _id: `job_${Date.now()}`,
                title,
                description,
                requirements: reqsArray,
                salary: Number(salary),
                location,
                jobType,
                experienceLevel: Number(experience) || 0,
                position: Number(position) || 1,
                company,
                created_by: userId,
                applications: [],
                createdAt: new Date().toISOString(),
            };
            mockStore.jobs.unshift(newJob);
            return res.status(201).json({
                message: "New job created successfully.",
                job: newJob,
                success: true,
            });
        }
    } catch (error) {
        console.error("Post Job Error:", error);
        return res.status(500).json({
            message: error.message || "Internal server error while posting job.",
            success: false,
        });
    }
};

// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";

        if (isDbConnected()) {
            const query = {
                $or: [
                    { title: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                ],
            };
            const jobs = await Job.find(query)
                .populate({ path: "company" })
                .sort({ createdAt: -1 });

            return res.status(200).json({
                jobs: jobs || [],
                success: true,
            });
        } else {
            const kw = keyword.toLowerCase();
            const populatedJobs = mockStore.jobs.map((j) => {
                let companyObj = j.company;
                if (typeof companyObj === "string") {
                    const foundComp = mockStore.companies.find(
                        (c) => String(c._id) === String(companyObj) || c.name.toLowerCase() === companyObj.toLowerCase()
                    );
                    companyObj = foundComp || { _id: companyObj, name: companyObj };
                } else if (companyObj && !companyObj.name && companyObj._id) {
                    const foundComp = mockStore.companies.find((c) => String(c._id) === String(companyObj._id));
                    if (foundComp) companyObj = foundComp;
                }
                return { ...j, company: companyObj };
            });

            const filteredJobs = populatedJobs.filter((j) =>
                !kw ||
                j.title?.toLowerCase().includes(kw) ||
                j.description?.toLowerCase().includes(kw) ||
                j.location?.toLowerCase().includes(kw) ||
                j.company?.name?.toLowerCase().includes(kw) ||
                (j.requirements && j.requirements.some((r) => r.toLowerCase().includes(kw)))
            );
            return res.status(200).json({
                jobs: filteredJobs,
                success: true,
            });
        }
    } catch (error) {
        console.error("Get All Jobs Error:", error);
        return res.status(200).json({
            jobs: mockStore.jobs || [],
            success: true,
        });
    }
};

// student & public job details
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;

        if (isDbConnected()) {
            try {
                let job = await Job.findById(jobId)
                    .populate({ path: "applications" })
                    .populate({ path: "company" });

                if (job) {
                    return res.status(200).json({ job, success: true });
                }
            } catch {
                // If invalid ObjectId or query fails, try mock fallback below
            }
        }

        const job = mockStore.jobs.find((j) => String(j._id) === String(jobId));
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false,
            });
        }

        let companyObj = job.company;
        if (typeof companyObj === "string") {
            const foundComp = mockStore.companies.find(
                (c) => String(c._id) === String(companyObj) || c.name.toLowerCase() === companyObj.toLowerCase()
            );
            companyObj = foundComp || { _id: companyObj, name: companyObj };
        } else if (companyObj && !companyObj.name && companyObj._id) {
            const foundComp = mockStore.companies.find((c) => String(c._id) === String(companyObj._id));
            if (foundComp) companyObj = foundComp;
        }

        const completeJob = {
            ...job,
            company: companyObj,
        };

        return res.status(200).json({ job: completeJob, success: true });
    } catch (error) {
        console.error("Get Job By Id Error:", error);
        return res.status(404).json({
            message: "Job not found.",
            success: false,
        });
    }
};

// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;

        // Check if user is platform administrator or sub-user
        let currentUser = null;
        let isAdminUser = false;
        if (isDbConnected()) {
            currentUser = await User.findById(adminId).catch(() => null);
            if (currentUser?.role === "admin") isAdminUser = true;
        } else {
            currentUser = mockStore.users.find((u) => String(u._id) === String(adminId));
            if (currentUser?.role === "admin") isAdminUser = true;
        }

        // Sub-user check: if sub-user has neither job posting nor applicant view permission
        if (currentUser?.isSubUser && !currentUser?.permissions?.canPostJobs && !currentUser?.permissions?.canViewAllApplicants) {
            return res.status(200).json({
                jobs: [],
                success: true,
                restricted: true,
                message: "Sub-user account does not have permission to view all jobs.",
            });
        }

        let parentId = currentUser?.isSubUser
            ? (currentUser.parentRecruiter?._id || currentUser.parentRecruiter)
            : null;

        // Auto-heal parentId if missing
        if (currentUser?.isSubUser && !parentId) {
            if (isDbConnected()) {
                const parentRecruiterUser = await User.findOne({
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
                const parentRecruiterUser = mockStore.users.find((u) =>
                    u.subUsers?.some(
                        (s) =>
                            String(s.userId) === String(adminId) ||
                            s.email?.toLowerCase() === currentUser.email?.toLowerCase()
                    )
                );
                if (parentRecruiterUser) {
                    parentId = parentRecruiterUser._id;
                    currentUser.parentRecruiter = parentRecruiterUser._id;
                }
            }
        }

        const effectiveRecruiterId = parentId || adminId;

        if (isDbConnected()) {
            const teamUserIds = [adminId, effectiveRecruiterId];
            if (currentUser?.isSubUser && parentId) {
                const siblings = await User.find({ parentRecruiter: parentId }).select("_id");
                siblings.forEach((s) => teamUserIds.push(s._id));
            } else if (!currentUser?.isSubUser) {
                const subUsers = await User.find({ parentRecruiter: adminId }).select("_id");
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

            const query = isAdminUser
                ? {}
                : {
                    $or: [
                        { created_by: { $in: objectIds } },
                        { created_by: { $in: stringIds } },
                    ]
                };
            const jobs = await Job.find(query)
                .populate({ path: "company" })
                .sort({ createdAt: -1 });

            return res.status(200).json({
                jobs: jobs || [],
                success: true,
            });
        } else {
            const teamIds = [String(adminId), String(effectiveRecruiterId)];
            if (currentUser?.isSubUser && parentId) {
                mockStore.users
                    .filter((u) => String(u.parentRecruiter) === String(parentId))
                    .forEach((u) => teamIds.push(String(u._id)));
            } else if (!currentUser?.isSubUser) {
                mockStore.users
                    .filter((u) => String(u.parentRecruiter) === String(adminId))
                    .forEach((u) => teamIds.push(String(u._id)));
            }

            const adminJobs = mockStore.jobs
                .filter(
                    (j) => isAdminUser ||
                        teamIds.includes(String(j.created_by)) ||
                        adminId === "recruiter_1" ||
                        (currentUser?.isSubUser && String(j.created_by) === "recruiter_1") ||
                        String(effectiveRecruiterId) === "recruiter_1"
                )
                .map((j) => {
                    let companyObj = j.company;
                    if (typeof companyObj === "string") {
                        const foundComp = mockStore.companies.find(
                            (c) => String(c._id) === String(companyObj) || c.name.toLowerCase() === companyObj.toLowerCase()
                        );
                        companyObj = foundComp || { _id: companyObj, name: companyObj };
                    } else if (companyObj && !companyObj.name && companyObj._id) {
                        const foundComp = mockStore.companies.find((c) => String(c._id) === String(companyObj._id));
                        if (foundComp) companyObj = foundComp;
                    }
                    return { ...j, company: companyObj };
                });

            return res.status(200).json({
                jobs: adminJobs,
                success: true,
            });
        }
    } catch (error) {
        console.error("Get Admin Jobs Error:", error);
        return res.status(200).json({
            jobs: [],
            success: true,
        });
    }
};
