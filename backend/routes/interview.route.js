import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
    scheduleInterview,
    getMyInterviews,
    getInterviewRoom,
    updateInterviewStatus,
    updateRoomWorkspace,
    submitEvaluation,
    generateAIQuestions,
} from "../controllers/interview.controller.js";

const router = express.Router();

// Scheduling and list
router.route("/schedule").post(isAuthenticated, scheduleInterview);
router.route("/my-interviews").get(isAuthenticated, getMyInterviews);

// Interview room
router.route("/room/:roomId").get(isAuthenticated, getInterviewRoom);
router.route("/room/:roomId/status").post(isAuthenticated, updateInterviewStatus);
router.route("/room/:roomId/workspace").post(isAuthenticated, updateRoomWorkspace);
router.route("/room/:roomId/evaluate").post(isAuthenticated, submitEvaluation);

// AI Assistant
router.route("/ai-questions").post(isAuthenticated, generateAIQuestions);

export default router;
