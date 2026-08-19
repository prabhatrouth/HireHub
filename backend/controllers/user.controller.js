import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// =========================
// REGISTER
// =========================
export const register = async (req, res) => {
    try {
        const {
            fullname,
            email,
            phoneNumber,
            password,
            role
        } = req.body;

        // Validate required fields
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "All fields are required.",
                success: false
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists with this email.",
                success: false
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Default profile
        const profileData = {
            bio: "",
            skills: [],
            resume: "",
            resumeOriginalName: "",
            profilePhoto: ""
        };

        // Upload profile image only if provided
        if (req.file) {
            try {
                const fileUri = getDataUri(req.file);

                const cloudResponse =
                    await cloudinary.uploader.upload(fileUri.content);

                profileData.profilePhoto = cloudResponse.secure_url;
            } catch (uploadError) {
                console.log("Profile upload error:", uploadError);
            }
        }

        // Create user
        const user = await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: profileData
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile
            }
        });

    } catch (error) {
        console.log("Register Error:", error);

        return res.status(500).json({
            message: "Server error during registration.",
            success: false
        });
    }
};


// =========================
// LOGIN
// =========================
export const login = async (req, res) => {
    try {
        const {
            email,
            password,
            role
        } = req.body;

        // Validate
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Email, password and role are required.",
                success: false
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false
            });
        }

        // Check password
        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false
            });
        }

        // Check role
        if (user.role !== role) {
            return res.status(400).json({
                message: `Account is registered as ${user.role}.`,
                success: false
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.SECRET_KEY,
            {
                expiresIn: "1d"
            }
        );

        // Production cookie settings
        const cookieOptions = {
            maxAge: 1 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax"
        };

        return res
            .status(200)
            .cookie("token", token, cookieOptions)
            .json({
                message: `Welcome back ${user.fullname}`,
                success: true,
                user: {
                    _id: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    profile: user.profile
                }
            });

    } catch (error) {
        console.log("Login Error:", error);

        return res.status(500).json({
            message: "Server error during login.",
            success: false
        });
    }
};


// =========================
// LOGOUT
// =========================
export const logout = async (req, res) => {
    try {
        const cookieOptions = {
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax"
        };

        return res
            .status(200)
            .cookie("token", "", cookieOptions)
            .json({
                message: "Logged out successfully.",
                success: true
            });

    } catch (error) {
        console.log("Logout Error:", error);

        return res.status(500).json({
            message: "Server error during logout.",
            success: false
        });
    }
};


// =========================
// UPDATE PROFILE
// =========================
export const updateProfile = async (req, res) => {
    try {
        const {
            fullname,
            email,
            phoneNumber,
            bio,
            skills
        } = req.body;

        const userId = req.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        // Update basic information
        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (bio !== undefined) user.profile.bio = bio;

        // Skills
        if (skills !== undefined) {
            user.profile.skills = skills
                .split(",")
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);
        }

        // Resume upload
        if (req.file) {
            const fileUri = getDataUri(req.file);

            const cloudResponse =
                await cloudinary.uploader.upload(fileUri.content, {
                    resource_type: "auto"
                });

            user.profile.resume = cloudResponse.secure_url;
            user.profile.resumeOriginalName =
                req.file.originalname;
        }

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully.",
            success: true,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile
            }
        });

    } catch (error) {
        console.log("Update Profile Error:", error);

        return res.status(500).json({
            message: "Failed to update profile.",
            success: false
        });
    }
};
