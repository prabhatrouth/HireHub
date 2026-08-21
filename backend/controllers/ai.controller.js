import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { buildCandidateScore, getResumeText, rankJobsWithAI } from "../services/gemini.service.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const CANDIDATE_LIMIT = 50;
const isDbConnected = () => mongoose.connection.readyState === 1;

export const getJobRecommendations = async (req, res) => {
    try {
        let student = null;
        let candidateJobs = [];

        if (isDbConnected()) {
            student = await User.findById(req.id).lean();
            if (!student) return res.status(404).json({ message: "User not found.", success: false });
            if (student.role !== "student") {
                return res.status(403).json({ message: "Recommendations are available to students only.", success: false });
            }

            const applications = await Application.find({ applicant: student._id }).select("job").lean();
            const appliedJobIds = applications.map((application) => application.job);
            candidateJobs = await Job.find({ _id: { $nin: appliedJobIds } })
                .populate("company", "name logo location")
                .sort({ createdAt: -1 })
                .limit(250)
                .lean();
        } else {
            student = mockStore.users.find((u) => String(u._id) === String(req.id));
            if (!student) {
                student = mockStore.users.find((u) => u.role === "student") || {
                    _id: req.id,
                    fullname: "Student User",
                    role: "student",
                    profile: { skills: ["React", "JavaScript", "HTML", "CSS"] },
                };
            }
            if (student.role !== "student") {
                return res.status(403).json({ message: "Recommendations are available to students only.", success: false });
            }
            candidateJobs = mockStore.jobs;
        }

        if (candidateJobs.length === 0) {
            return res.status(200).json({ recommendations: [], success: true });
        }

        const resumeText = await getResumeText(student.profile?.resume);
        const profile = {
            fullname: student.fullname,
            bio: student.profile?.bio || "",
            skills: student.profile?.skills || [],
            resumeText,
        };

        const candidates = candidateJobs
            .map((job) => ({ job, score: buildCandidateScore(profile, job) }))
            .sort((a, b) => b.score - a.score || new Date(b.job.createdAt) - new Date(a.job.createdAt))
            .slice(0, CANDIDATE_LIMIT)
            .map(({ job }) => job);

        const aiRecommendations = await rankJobsWithAI({ profile, resumeText, jobs: candidates });
        const jobsById = new Map(candidates.map((job) => [String(job._id), job]));
        const seenJobIds = new Set();
        const recommendations = aiRecommendations
            .filter((item) => jobsById.has(item.jobId) && !seenJobIds.has(item.jobId) && seenJobIds.add(item.jobId))
            .slice(0, 10)
            .map((item) => ({
                jobId: item.jobId,
                job: jobsById.get(item.jobId),
                matchScore: Math.max(0, Math.min(100, Number(item.matchScore) || 0)),
                reason: item.reason,
                matchingSkills: item.matchingSkills || [],
                missingSkills: item.missingSkills || [],
            }));

        return res.status(200).json({ recommendations, success: true });
    } catch (error) {
        console.error("AI job recommendations failed:", error.message);
        return res.status(200).json({
            recommendations: [],
            success: true,
            message: "Unable to generate AI recommendations right now.",
        });
    }
};
