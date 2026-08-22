import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;

        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false,
            });
        }

        let cloudResponse;
        const file = req.file;
        if (file && process.env.CLOUD_NAME && process.env.API_KEY) {
            try {
                const fileUri = getDataUri(file);
                cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            } catch (cErr) {
                console.warn("Cloudinary upload failed, continuing without image:", cErr.message);
            }
        }

        if (isDbConnected()) {
            const user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({
                    message: "User already exists with this email.",
                    success: false,
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                fullname,
                email,
                phoneNumber,
                password: hashedPassword,
                role,
                profile: {
                    profilePhoto: cloudResponse ? cloudResponse.secure_url : "",
                },
            });
        } else {
            // Fallback in-memory store
            const existing = mockStore.users.find((u) => u.email === email);
            if (existing) {
                return res.status(400).json({
                    message: "User already exists with this email.",
                    success: false,
                });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                _id: `user_${Date.now()}`,
                fullname,
                email,
                phoneNumber,
                password: hashedPassword,
                role,
                profile: {
                    profilePhoto: cloudResponse ? cloudResponse.secure_url : "",
                    bio: "",
                    skills: [],
                    resume: "",
                    resumeOriginalName: "",
                },
            };
            mockStore.users.push(newUser);
        }

        return res.status(201).json({
            message: "Account created successfully.",
            success: true,
        });
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({
            message: "Internal server error during registration",
            success: false,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false,
            });
        }

        let user = null;
        if (isDbConnected()) {
            user = await User.findOne({ email });
        } else {
            user = mockStore.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        }

        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false,
            });
        }

        const tokenData = {
            userId: user._id,
        };

        const secretKey = process.env.SECRET_KEY || "hirehub_default_secret_jwt_key_2026";
        // Session token expires in 3 hours of inactivity/idle time
        const token = jwt.sign(tokenData, secretKey, { expiresIn: "3h" });

        const userPayload = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile || {},
            isSubUser: Boolean(user.isSubUser),
            parentRecruiter: user.parentRecruiter || null,
            subRole: user.subRole || "",
            department: user.department || "",
            specialty: user.specialty || [],
            permissions: user.permissions || {
                canViewAssignedInterviews: true,
                canConductInterview: true,
                canSubmitReport: true,
                canViewAllInterviews: false,
                canPostJobs: false,
                canViewAllApplicants: false,
                canManageCompanies: false,
                canFinalizeHiringDecision: false,
            },
            subUsers: user.subUsers || [],
        };

        return res
            .status(200)
            .cookie("token", token, {
                maxAge: 3 * 60 * 60 * 1000, // 3 hours
                httpOnly: true,
                secure: true,
                sameSite: "none",
            })
            .json({
                message: `Welcome back ${user.fullname}`,
                user: userPayload,
                token,
                success: true,
            });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            message: "Internal server error during login",
            success: false,
        });
    }
};

export const logout = async (req, res) => {
    try {
        return res
            .status(200)
            .cookie("token", "", {
                maxAge: 0,
                httpOnly: true,
                secure: true,
                sameSite: "none",
            })
            .json({
                message: "Logged out successfully.",
                success: true,
            });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({
            message: "Internal server error during logout",
            success: false,
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        const file = req.file;

        let cloudResponse;
        if (file && process.env.CLOUD_NAME && process.env.API_KEY) {
            try {
                const fileUri = getDataUri(file);
                cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            } catch (cErr) {
                console.warn("Cloudinary upload failed:", cErr.message);
            }
        }

        let skillsArray = [];
        if (skills) {
            skillsArray = Array.isArray(skills) ? skills : skills.split(",").map((s) => s.trim());
        }

        const userId = req.id;
        let updatedUser = null;

        if (isDbConnected()) {
            let user = await User.findById(userId);
            if (!user) {
                return res.status(400).json({
                    message: "User not found.",
                    success: false,
                });
            }

            if (fullname) user.fullname = fullname;
            if (email) user.email = email;
            if (phoneNumber) user.phoneNumber = phoneNumber;
            if (!user.profile) user.profile = {};
            if (bio) user.profile.bio = bio;
            if (skillsArray.length > 0) user.profile.skills = skillsArray;

            if (cloudResponse) {
                user.profile.resume = cloudResponse.secure_url;
                user.profile.resumeOriginalName = file.originalname;
            }

            await user.save();
            updatedUser = {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile,
            };
        } else {
            let user = mockStore.users.find((u) => String(u._id) === String(userId));
            if (!user) {
                return res.status(400).json({
                    message: "User not found.",
                    success: false,
                });
            }
            if (fullname) user.fullname = fullname;
            if (email) user.email = email;
            if (phoneNumber) user.phoneNumber = phoneNumber;
            if (!user.profile) user.profile = {};
            if (bio) user.profile.bio = bio;
            if (skillsArray.length > 0) user.profile.skills = skillsArray;
            if (file) {
                user.profile.resume = "https://example.com/resume.pdf";
                user.profile.resumeOriginalName = file.originalname;
            }
            updatedUser = {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile,
            };
        }

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: updatedUser,
            success: true,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return res.status(500).json({
            message: "Internal server error during profile update",
            success: false,
        });
    }
};
