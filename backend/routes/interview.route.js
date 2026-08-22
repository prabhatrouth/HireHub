import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
    scheduleInterview,
    getMyInterviews,
    getInterviewRoom,
    updateInterviewStatus,
    updateRoomWorkspace,
    submitEvaluation,
    finalizeRecruiterDecision,
    logRecruiterInspection,
    completeInterview,
    getSubUsers,
    addSubUser,
    deleteSubUser,
    generateAIQuestions,
} from "../controllers/interview.controller.js";

const router = express.Router();

// Scheduling and list
router.route("/schedule").post(isAuthenticated, scheduleInterview);
router.route("/my-interviews").get(isAuthenticated, getMyInterviews);

// Sub-users / Technical Interviewers Panel Management
router.route("/sub-users").get(isAuthenticated, getSubUsers).post(isAuthenticated, addSubUser);
router.route("/sub-users/:subUserId").delete(isAuthenticated, deleteSubUser);

// Interview room & lifecycle
router.route("/room/:roomId").get(isAuthenticated, getInterviewRoom);
router.route("/room/:roomId/status").post(isAuthenticated, updateInterviewStatus);
router.route("/room/:roomId/workspace").post(isAuthenticated, updateRoomWorkspace);
router.route("/room/:roomId/evaluate").post(isAuthenticated, submitEvaluation);
router.route("/room/:roomId/finalize-decision").post(isAuthenticated, finalizeRecruiterDecision);
router.route("/room/:roomId/inspection").post(isAuthenticated, logRecruiterInspection);
router.route("/room/:roomId/complete").post(isAuthenticated, completeInterview);

// AI Assistant
router.route("/ai-questions").post(isAuthenticated, generateAIQuestions);

export default router;
