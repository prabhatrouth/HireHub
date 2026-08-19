import express from "express";
import { getJobRecommendations } from "../controllers/ai.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/recommendations").get(isAuthenticated, getJobRecommendations);

export default router;
