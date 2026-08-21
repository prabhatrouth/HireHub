import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import {
    buildCandidateScore,
    getResumeText,
    rankJobsWithAI,
    evaluateApplicantsWithAI,
    generateCoverLetterWithAI,
    generateInterviewPrepWithAI,
    generateJobFitAnalysisWithAI,
    generateJobDescriptionWithAI,
    analyzeResumeWithAI,
    optimizeResumeBulletWithAI,
} from "../services/gemini.service.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const CANDIDATE_LIMIT = 50;
const isDbConnected = () => mongoose.connection.readyState === 1;


export const getJobRecommendations = async (req, res) => {
    try {
        let student = null;
        let candidateJobs = [];
        const isGuest = !req.id;

        if (isDbConnected()) {
            if (!isGuest) {
                student = await User.findById(req.id).lean();
                if (student && student.role === "recruiter") {
                    return res.status(200).json({
                        recommendations: [],
                        isRecruiter: true,
                        message: "Recommendations are tailored for candidates. Visit Recruiter Hub to manage your postings.",
                        success: true,
                    });
                }
            }

            let appliedJobIds = [];
            if (student) {
                const applications = await Application.find({ applicant: student._id }).select("job").lean();
                appliedJobIds = applications.map((application) => application.job);
            }

            candidateJobs = await Job.find({ _id: { $nin: appliedJobIds } })
                .populate("company", "name logo location")
                .sort({ createdAt: -1 })
                .limit(250)
                .lean();
        } else {
            if (!isGuest) {
                student = mockStore.users.find((u) => String(u._id) === String(req.id));
                if (student && student.role === "recruiter") {
                    return res.status(200).json({
                        recommendations: [],
                        isRecruiter: true,
                        message: "Recommendations are tailored for candidates. Visit Recruiter Hub to manage your postings.",
                        success: true,
                    });
                }
            }
            candidateJobs = mockStore.jobs;
        }

        if (candidateJobs.length === 0) {
            return res.status(200).json({ recommendations: [], success: true, isGuest });
        }

        const resumeText = student ? await getResumeText(student.profile?.resume) : "";
        const profile = {
            fullname: student?.fullname || "Candidate",
            bio: student?.profile?.bio || "Software Engineer looking for opportunities in technology.",
            skills: (student?.profile?.skills && student.profile.skills.length > 0)
                ? student.profile.skills
                : ["React", "JavaScript", "Node.js", "TypeScript", "Python", "SQL", "Git"],
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
            .slice(0, 12)
            .map((item) => ({
                jobId: item.jobId,
                job: jobsById.get(item.jobId),
                matchScore: Math.max(0, Math.min(100, Number(item.matchScore) || 0)),
                reason: item.reason,
                matchingSkills: item.matchingSkills || [],
                missingSkills: item.missingSkills || [],
            }));

        return res.status(200).json({
            recommendations,
            success: true,
            isGuest,
            candidateSkills: profile.skills,
        });
    } catch (error) {
        console.error("AI job recommendations failed:", error.message);
        return res.status(200).json({
            recommendations: [],
            success: true,
            message: "Unable to generate AI recommendations right now.",
        });
    }
};

// Recruiter AI Applicant Ranking & Skill Match Analysis
export const getApplicantsAIEvaluation = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        let job = null;
        let applications = [];

        if (isDbConnected()) {
            job = await Job.findById(jobId).populate({
                path: "applications",
                options: { sort: { createdAt: -1 } },
                populate: { path: "applicant" },
            });

            if (!job) {
                return res.status(404).json({ message: "Job not found", success: false });
            }
            applications = job.applications || [];
        } else {
            job = mockStore.jobs.find((j) => String(j._id) === String(jobId));
            if (!job) {
                return res.status(404).json({ message: "Job not found", success: false });
            }
            applications = mockStore.applications
                .filter((a) => String(a.job) === String(jobId))
                .map((a) => {
                    const applicant = typeof a.applicant === "object"
                        ? a.applicant
                        : mockStore.users.find((u) => String(u._id) === String(a.applicant)) || { fullname: "Applicant" };
                    return { ...a, applicant };
                });
        }

        if (applications.length === 0) {
            return res.status(200).json({
                job,
                evaluations: [],
                stats: { total: 0, highMatches: 0, avgScore: 0 },
                success: true,
            });
        }

        const evaluations = await evaluateApplicantsWithAI({ job, applications });
        const evalMap = new Map(evaluations.map((e) => [String(e.applicationId), e]));

        const scoredApplications = applications.map((app) => {
            const aiData = evalMap.get(String(app._id)) || {
                matchScore: 60,
                fitTier: "Moderate Match",
                matchingSkills: [],
                missingSkills: [],
                strengths: ["Profile under review"],
                recommendationSummary: "Standard applicant profile.",
            };
            return {
                ...app,
                aiEvaluation: aiData,
            };
        }).sort((a, b) => (b.aiEvaluation?.matchScore || 0) - (a.aiEvaluation?.matchScore || 0));

        const total = scoredApplications.length;
        const highMatches = scoredApplications.filter((a) => (a.aiEvaluation?.matchScore || 0) >= 80).length;
        const totalScore = scoredApplications.reduce((acc, curr) => acc + (curr.aiEvaluation?.matchScore || 0), 0);
        const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

        return res.status(200).json({
            job,
            applications: scoredApplications,
            evaluations,
            stats: {
                total,
                highMatches,
                avgScore,
            },
            success: true,
        });
    } catch (error) {
        console.error("AI applicant evaluation failed:", error);
        return res.status(500).json({
            message: "Failed to evaluate applicants with AI",
            success: false,
        });
    }
};

// 3. AI Cover Letter Generation
export const generateCoverLetter = async (req, res) => {
    try {
        const { jobId, customNote } = req.body;
        let student = null;
        let job = null;

        if (isDbConnected()) {
            student = await User.findById(req.id).lean();
            if (jobId) {
                job = await Job.findById(jobId).populate("company").lean();
            }
        } else {
            student = mockStore.users.find((u) => String(u._id) === String(req.id));
            if (jobId) {
                job = mockStore.jobs.find((j) => String(j._id) === String(jobId));
            }
        }

        if (!student) {
            student = {
                fullname: req.body.fullname || "Applicant",
                profile: {
                    skills: req.body.skills || ["Software Engineering"],
                    bio: req.body.bio || "",
                },
            };
        }

        if (!job && req.body.job) {
            job = req.body.job;
        }

        if (!job) {
            return res.status(400).json({ message: "Job information required for cover letter.", success: false });
        }

        const profile = {
            fullname: student.fullname,
            bio: student.profile?.bio || "",
            skills: student.profile?.skills || [],
        };

        const coverLetter = await generateCoverLetterWithAI({ profile, job, customNote });
        return res.status(200).json({ coverLetter, success: true });
    } catch (error) {
        console.error("Generate cover letter error:", error);
        return res.status(500).json({ message: "Failed to generate cover letter", success: false });
    }
};

// 4. AI Interview Preparation Guide
export const getInterviewPrep = async (req, res) => {
    try {
        const { jobId } = req.body;
        let student = null;
        let job = null;

        if (isDbConnected()) {
            if (req.id) student = await User.findById(req.id).lean();
            if (jobId) job = await Job.findById(jobId).populate("company").lean();
        } else {
            if (req.id) student = mockStore.users.find((u) => String(u._id) === String(req.id));
            if (jobId) job = mockStore.jobs.find((j) => String(j._id) === String(jobId));
        }

        if (!job && req.body.job) {
            job = req.body.job;
        }

        if (!job) {
            return res.status(400).json({ message: "Job data is required for interview prep.", success: false });
        }

        const profile = {
            fullname: student?.fullname || "Candidate",
            skills: student?.profile?.skills || [],
        };

        const interviewPrep = await generateInterviewPrepWithAI({ job, profile });
        return res.status(200).json({ interviewPrep, success: true });
    } catch (error) {
        console.error("Interview prep error:", error);
        return res.status(500).json({ message: "Failed to generate interview prep guide", success: false });
    }
};

// 5. AI Candidate-to-Job Career & Skill Compatibility
export const getCareerFitAnalysis = async (req, res) => {
    try {
        const { jobId } = req.body;
        let student = null;
        let job = null;

        if (isDbConnected()) {
            if (req.id) student = await User.findById(req.id).lean();
            if (jobId) job = await Job.findById(jobId).populate("company").lean();
        } else {
            if (req.id) student = mockStore.users.find((u) => String(u._id) === String(req.id));
            if (jobId) job = mockStore.jobs.find((j) => String(j._id) === String(jobId));
        }

        if (!job && req.body.job) {
            job = req.body.job;
        }

        if (!job) {
            return res.status(400).json({ message: "Job information required.", success: false });
        }

        const profile = {
            fullname: student?.fullname || req.body.profile?.fullname || "Candidate",
            bio: student?.profile?.bio || req.body.profile?.bio || "",
            skills: student?.profile?.skills || req.body.profile?.skills || [],
        };

        const fitAnalysis = await generateJobFitAnalysisWithAI({ job, profile });
        return res.status(200).json({ fitAnalysis, success: true });
    } catch (error) {
        console.error("Career fit analysis error:", error);
        return res.status(500).json({ message: "Failed to generate career fit analysis", success: false });
    }
};

// 6. Recruiter AI Job Description Generator
export const generateJobDescription = async (req, res) => {
    try {
        const { title, companyName, location, jobType, experience, skills } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Job title is required to generate description.", success: false });
        }

        const generatedData = await generateJobDescriptionWithAI({
            title,
            companyName,
            location,
            jobType,
            experience,
            skills,
        });

        return res.status(200).json({ data: generatedData, success: true });
    } catch (error) {
        console.error("Generate job description error:", error);
        return res.status(500).json({ message: "Failed to generate job description", success: false });
    }
};

// 7. Student AI Resume Checker & ATS Analyzer
export const analyzeResume = async (req, res) => {
    try {
        const { resumeText, targetRole, skills, bio } = req.body;
        let student = null;

        if (req.id) {
            if (isDbConnected()) {
                student = await User.findById(req.id).lean();
            } else {
                student = mockStore.users.find((u) => String(u._id) === String(req.id));
            }
        }

        const profile = {
            fullname: student?.fullname || req.body.fullname || "Student Candidate",
            bio: student?.profile?.bio || bio || "",
            skills: student?.profile?.skills || skills || [],
        };

        let content = resumeText || "";
        // If student has a resume URL and resumeText wasn't passed directly
        if (!content && student?.profile?.resume) {
            content = await getResumeText(student.profile.resume);
        }

        const analysis = await analyzeResumeWithAI({
            resumeText: content,
            targetRole,
            profile,
        });

        return res.status(200).json({ analysis, success: true });
    } catch (error) {
        console.error("Resume analysis error:", error);
        return res.status(500).json({ message: "Failed to analyze resume", success: false });
    }
};

// 8. Instant AI Resume Bullet Enhancer
export const optimizeResumeBullet = async (req, res) => {
    try {
        const { bulletText, targetRole } = req.body;

        if (!bulletText || !bulletText.trim()) {
            return res.status(400).json({ message: "Bullet point text is required", success: false });
        }

        const result = await optimizeResumeBulletWithAI({ bulletText, targetRole });
        return res.status(200).json({ result, success: true });
    } catch (error) {
        console.error("Bullet optimization error:", error);
        return res.status(500).json({ message: "Failed to optimize resume bullet", success: false });
    }
};


