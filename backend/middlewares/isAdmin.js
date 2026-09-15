import { User } from "../models/user.model.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

export const isAdmin = async (req, res, next) => {
    try {
        const userId = req.id;
        if (!userId) {
            return res.status(401).json({
                message: "Authentication required. Please log in as Administrator.",
                success: false,
            });
        }

        let user = null;
        if (isDbConnected()) {
            try {
                user = await User.findById(userId);
            } catch {
                user = null;
            }
        }

        if (!user) {
            user = mockStore.users.find(
                (u) => String(u._id) === String(userId) || u.email?.toLowerCase() === String(userId).toLowerCase()
            );
        }

        if (!user || user.role !== "admin") {
            return res.status(403).json({
                message: "Access Forbidden: Platform Administrator privileges required.",
                success: false,
            });
        }

        req.adminUser = user;
        next();
    } catch (error) {
        console.error("isAdmin Middleware Error:", error);
        return res.status(500).json({
            message: "Internal server error during authorization verification.",
            success: false,
        });
    }
};

export default isAdmin;
