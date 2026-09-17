import express from "express";
import {
    adminLogin,
    getAdminStats,
    getAllPlatformUsers,
    createPlatformUser,
    updateUserRole,
    deletePlatformUser,
    getAllPlatformJobs,
    deletePlatformJob,
    getAllPlatformCompanies,
    deletePlatformCompany,
    getAllPlatformApplications,
    updatePlatformApplicationStatus,
    getAllPlatformInterviews,
    deletePlatformInterview,
} from "../controllers/admin.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import isAdmin from "../middlewares/isAdmin.js";

const router = express.Router();

// 1. Admin Authentication (accessed by /admin/login page)
router.post("/login", adminLogin);

// Protected Administrator Routes (Require isAuthenticated AND isAdmin)
router.get("/stats", isAuthenticated, isAdmin, getAdminStats);

// User Management
router.get("/users", isAuthenticated, isAdmin, getAllPlatformUsers);
router.post("/users", isAuthenticated, isAdmin, createPlatformUser);
router.put("/users/:id/role", isAuthenticated, isAdmin, updateUserRole);
router.delete("/users/:id", isAuthenticated, isAdmin, deletePlatformUser);

// Job Management
router.get("/jobs", isAuthenticated, isAdmin, getAllPlatformJobs);
router.delete("/jobs/:id", isAuthenticated, isAdmin, deletePlatformJob);

// Company Management
router.get("/companies", isAuthenticated, isAdmin, getAllPlatformCompanies);
router.delete("/companies/:id", isAuthenticated, isAdmin, deletePlatformCompany);

// Application Management
router.get("/applications", isAuthenticated, isAdmin, getAllPlatformApplications);
router.put("/applications/:id/status", isAuthenticated, isAdmin, updatePlatformApplicationStatus);

// Interview Management
router.get("/interviews", isAuthenticated, isAdmin, getAllPlatformInterviews);
router.delete("/interviews/:id", isAuthenticated, isAdmin, deletePlatformInterview);

export default router;
