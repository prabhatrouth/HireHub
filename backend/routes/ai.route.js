import express from "express";
import {
    getJobRecommendations,
    getApplicantsAIEvaluation,
    generateCoverLetter,
    getInterviewPrep,
    getCareerFitAnalysis,
    generateJobDescription,
} from "../controllers/ai.controller.js";
import isAuthenticated, { optionalAuth } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/recommendations").get(isAuthenticated, getJobRecommendations);
router.route("/evaluate-applicants/:jobId").get(isAuthenticated, getApplicantsAIEvaluation);
router.route("/cover-letter").post(optionalAuth, generateCoverLetter);
router.route("/interview-prep").post(optionalAuth, getInterviewPrep);
router.route("/career-fit").post(optionalAuth, getCareerFitAnalysis);
router.route("/generate-job-description").post(optionalAuth, generateJobDescription);

export default router;

