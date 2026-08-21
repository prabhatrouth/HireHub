import express from "express";
import { getJobRecommendations, getApplicantsAIEvaluation } from "../controllers/ai.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/recommendations").get(isAuthenticated, getJobRecommendations);
router.route("/evaluate-applicants/:jobId").get(isAuthenticated, getApplicantsAIEvaluation);

export default router;
