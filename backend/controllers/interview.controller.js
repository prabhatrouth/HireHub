import { Interview } from "../models/interview.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js";
import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

// 1. Schedule a new interview
export const scheduleInterview = async (req, res) => {
    try {
        const recruiterId = req.id;
        const {
            jobId,
            candidateId,
            applicationId,
            interviewDate,
            interviewTime,
            durationMinutes = 45,
            roundType = "Technical Round",
            notes = "",
            interviewerType = "recruiter",
            assignedInterviewer = {},
        } = req.body;

        if (!jobId || !candidateId || !interviewDate || !interviewTime) {
            return res.status(400).json({
                message: "Job, Candidate, Date, and Time are required fields.",
                success: false,
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job posting not found.",
                success: false,
            });
        }

        const candidate = await User.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({
                message: "Candidate profile not found.",
                success: false,
            });
        }

        // Generate clean unique room id (e.g. hh-tech-839f2a)
        const randomSlug = Math.random().toString(36).substring(2, 8);
        const roomId = `hh-${roundType.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "meet"}-${randomSlug}`;
        const meetingLink = `/interview/room/${roomId}`;

        const newInterview = await Interview.create({
            job: jobId,
            application: applicationId || undefined,
            candidate: candidateId,
            recruiter: recruiterId,
            company: job.company,
            interviewDate,
            interviewTime,
            durationMinutes: Number(durationMinutes) || 45,
            roundType,
            status: "scheduled",
            roomId,
            meetingLink,
            notes,
            interviewerType: interviewerType || "recruiter",
            assignedInterviewer: {
                name: assignedInterviewer.name || "",
                email: assignedInterviewer.email || "",
                role: assignedInterviewer.role || "",
                department: assignedInterviewer.department || "",
                notes: assignedInterviewer.notes || "",
                subUserId: assignedInterviewer.subUserId || "",
            },
        });

        const populatedInterview = await Interview.findById(newInterview._id)
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email")
            .populate("job", "title location salary requirements")
            .populate("company", "name logo location");

        return res.status(201).json({
            message: `Interview scheduled with ${candidate.fullname} for ${interviewDate} at ${interviewTime}`,
            success: true,
            interview: populatedInterview,
        });
    } catch (error) {
        console.error("Schedule Interview Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to schedule interview.",
            success: false,
        });
    }
};

// 2. Get all interviews for current user (candidate or recruiter)
export const getMyInterviews = async (req, res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false,
            });
        }

        let query = {};
        if (user.role === "recruiter") {
            query = { recruiter: userId };
        } else {
            query = { candidate: userId };
        }

        const interviews = await Interview.find(query)
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email")
            .populate("job", "title location salary requirements")
            .populate("company", "name logo location")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            interviews,
        });
    } catch (error) {
        console.error("Get Interviews Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch interviews.",
            success: false,
        });
    }
};

// 3. Get specific interview room data
export const getInterviewRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const interview = await Interview.findOne({ roomId })
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email")
            .populate("job", "title description location salary requirements")
            .populate("company", "name logo location website");

        if (!interview) {
            return res.status(404).json({
                message: "Interview room not found or link has expired.",
                success: false,
            });
        }

        return res.status(200).json({
            success: true,
            interview,
        });
    } catch (error) {
        console.error("Get Interview Room Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to load interview room.",
            success: false,
        });
    }
};

// 4. Update interview room status (e.g. 'live', 'completed', 'cancelled')
export const updateInterviewStatus = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { status } = req.body;

        if (!["scheduled", "live", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status value.",
                success: false,
            });
        }

        const interview = await Interview.findOneAndUpdate(
            { roomId },
            { status },
            { new: true }
        )
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email")
            .populate("job", "title location salary");

        if (!interview) {
            return res.status(404).json({
                message: "Interview room not found.",
                success: false,
            });
        }

        return res.status(200).json({
            message: `Interview status updated to ${status}`,
            success: true,
            interview,
        });
    } catch (error) {
        console.error("Update Interview Status Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to update interview status.",
            success: false,
        });
    }
};

// 5. Update shared code / chat in room
export const updateRoomWorkspace = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { sharedCode, sharedLanguage, chatMessage } = req.body;

        const updateFields = {};
        if (sharedCode !== undefined) updateFields.sharedCode = sharedCode;
        if (sharedLanguage !== undefined) updateFields.sharedLanguage = sharedLanguage;

        let pushFields = {};
        if (chatMessage && chatMessage.text) {
            pushFields = {
                chatMessages: {
                    senderId: req.id || "guest",
                    senderName: chatMessage.senderName || "Participant",
                    senderRole: chatMessage.senderRole || "candidate",
                    text: chatMessage.text,
                    timestamp: new Date(),
                },
            };
        }

        const updateQuery = Object.keys(pushFields).length > 0
            ? { $set: updateFields, $push: pushFields }
            : { $set: updateFields };

        const interview = await Interview.findOneAndUpdate({ roomId }, updateQuery, {
            new: true,
        });

        if (!interview) {
            return res.status(404).json({
                message: "Interview room not found.",
                success: false,
            });
        }

        return res.status(200).json({
            success: true,
            sharedCode: interview.sharedCode,
            sharedLanguage: interview.sharedLanguage,
            chatMessages: interview.chatMessages,
        });
    } catch (error) {
        console.error("Update Workspace Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to update room workspace.",
            success: false,
        });
    }
};

// 6. Submit interview scorecard & hiring recommendation
export const submitEvaluation = async (req, res) => {
    try {
        const { roomId } = req.params;
        const {
            rating = 0,
            technicalScore = 0,
            communicationScore = 0,
            problemSolvingScore = 0,
            cultureFitScore = 0,
            hiringDecision = "Undecided",
            interviewerFeedback = "",
            advanceApplicationStatus,
        } = req.body;

        const interview = await Interview.findOne({ roomId });
        if (!interview) {
            return res.status(404).json({
                message: "Interview room not found.",
                success: false,
            });
        }

        const calculatedRating = Number(rating) || Math.round(
            (Number(technicalScore) + Number(communicationScore) + Number(problemSolvingScore) + Number(cultureFitScore)) / 4
        ) || 0;

        interview.evaluation = {
            rating: calculatedRating,
            technicalScore: Number(technicalScore),
            communicationScore: Number(communicationScore),
            problemSolvingScore: Number(problemSolvingScore),
            cultureFitScore: Number(cultureFitScore),
            hiringDecision,
            interviewerFeedback,
            evaluatedAt: new Date(),
        };
        interview.status = "completed";
        await interview.save();

        // Optionally update application status if linked
        if (advanceApplicationStatus && interview.application) {
            await Application.findByIdAndUpdate(interview.application, {
                status: advanceApplicationStatus,
            });
        }

        const updatedInterview = await Interview.findById(interview._id)
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email")
            .populate("job", "title location salary requirements")
            .populate("company", "name logo location");

        return res.status(200).json({
            message: "Scorecard and hiring decision saved successfully!",
            success: true,
            interview: updatedInterview,
        });
    } catch (error) {
        console.error("Submit Evaluation Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to save evaluation scorecard.",
            success: false,
        });
    }
};

// 7. Complete interview with quick status or remarks
export const completeInterview = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { notes = "", hiringDecision, advanceApplicationStatus } = req.body;

        const interview = await Interview.findOne({ roomId });
        if (!interview) {
            return res.status(404).json({
                message: "Interview room not found.",
                success: false,
            });
        }

        interview.status = "completed";
        if (hiringDecision) {
            interview.evaluation.hiringDecision = hiringDecision;
        }
        if (notes) {
            interview.evaluation.interviewerFeedback = notes;
            interview.evaluation.evaluatedAt = new Date();
        }
        await interview.save();

        if (advanceApplicationStatus && interview.application) {
            await Application.findByIdAndUpdate(interview.application, {
                status: advanceApplicationStatus,
            });
        }

        const updatedInterview = await Interview.findById(interview._id)
            .populate("candidate", "fullname email phoneNumber profile")
            .populate("recruiter", "fullname email")
            .populate("job", "title location salary requirements")
            .populate("company", "name logo location");

        return res.status(200).json({
            message: "Interview marked as completed successfully.",
            success: true,
            interview: updatedInterview,
        });
    } catch (error) {
        console.error("Complete Interview Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to complete interview.",
            success: false,
        });
    }
};

// 8. Sub-Users / Technical Interviewers Management for Recruiter
export const getSubUsers = async (req, res) => {
    try {
        const recruiterId = req.id;
        const recruiter = await User.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: "Recruiter not found.", success: false });
        }

        // Return recruiter's registered sub-users (or default preset if empty)
        let subUsers = recruiter.subUsers || [];
        if (subUsers.length === 0) {
            // Provide sensible initial team member templates so recruiter immediately sees options
            const initialMembers = [
                {
                    name: "Alex Rivera",
                    email: "alex.rivera@eng.company.com",
                    role: "Staff Backend Engineer",
                    department: "Distributed Systems & Cloud",
                    specialty: ["Node.js", "Go", "Kubernetes", "System Design"],
                    phone: "+1-555-0192",
                    createdAt: new Date(),
                },
                {
                    name: "Priya Nair",
                    email: "priya.nair@eng.company.com",
                    role: "Senior Frontend Architect",
                    department: "Web Platform & UI Core",
                    specialty: ["React", "TypeScript", "Performance", "CSS/Web Standards"],
                    phone: "+1-555-0144",
                    createdAt: new Date(),
                },
                {
                    name: "David Kim",
                    email: "david.kim@eng.company.com",
                    role: "Engineering Manager",
                    department: "Product Engineering",
                    specialty: ["System Architecture", "Behavioral & STAR", "Culture & Leadership"],
                    phone: "+1-555-0177",
                    createdAt: new Date(),
                }
            ];
            recruiter.subUsers = initialMembers;
            await recruiter.save();
            subUsers = recruiter.subUsers;
        }

        return res.status(200).json({
            success: true,
            subUsers,
        });
    } catch (error) {
        console.error("Get SubUsers Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to fetch technical interviewers.",
            success: false,
        });
    }
};

export const addSubUser = async (req, res) => {
    try {
        const recruiterId = req.id;
        const { name, email, role, department, specialty, phone } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and Email are required for technical interviewer.",
                success: false,
            });
        }

        const recruiter = await User.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: "Recruiter not found.", success: false });
        }

        const newSubUser = {
            name,
            email,
            role: role || "Technical Interviewer",
            department: department || "Engineering",
            specialty: Array.isArray(specialty)
                ? specialty
                : specialty ? specialty.split(",").map((s) => s.trim()) : ["Coding", "System Design"],
            phone: phone || "",
            createdAt: new Date(),
        };

        recruiter.subUsers.push(newSubUser);
        await recruiter.save();

        return res.status(201).json({
            message: `Technical interviewer ${name} added to your team.`,
            success: true,
            subUsers: recruiter.subUsers,
            newSubUser: recruiter.subUsers[recruiter.subUsers.length - 1],
        });
    } catch (error) {
        console.error("Add SubUser Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to add technical interviewer.",
            success: false,
        });
    }
};

export const deleteSubUser = async (req, res) => {
    try {
        const recruiterId = req.id;
        const { subUserId } = req.params;

        const recruiter = await User.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: "Recruiter not found.", success: false });
        }

        recruiter.subUsers = recruiter.subUsers.filter(
            (u) => u._id.toString() !== subUserId
        );
        await recruiter.save();

        return res.status(200).json({
            message: "Technical interviewer removed from your team.",
            success: true,
            subUsers: recruiter.subUsers,
        });
    } catch (error) {
        console.error("Delete SubUser Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to delete technical interviewer.",
            success: false,
        });
    }
};

// 7. AI Interview Assistant - Generate tailored live interview questions
export const generateAIQuestions = async (req, res) => {
    try {
        const { jobTitle = "Software Engineer", skills = [], roundType = "Technical Round" } = req.body;

        const ai = getGeminiClient();
        if (!ai) {
            // Intelligent fallback questions
            return res.status(200).json({
                success: true,
                questions: [
                    {
                        question: `Can you explain your experience building scalable solutions with ${skills[0] || "modern frameworks"}?`,
                        category: "Core Architecture",
                        difficulty: "Medium",
                        evaluationCriteria: "Depth of understanding, state management, and production pitfalls.",
                    },
                    {
                        question: "How do you approach debugging complex memory leaks or slow API latencies in production?",
                        category: "Problem Solving",
                        difficulty: "Hard",
                        evaluationCriteria: "Structured root-cause methodology, browser/server profiling tools.",
                    },
                    {
                        question: "Walk us through an architectural decision where you had to make a trade-off between performance and engineering velocity.",
                        category: "System Design & Leadership",
                        difficulty: "Hard",
                        evaluationCriteria: "Pragmatic decision making and communication clarity.",
                    },
                ],
            });
        }

        const prompt = `Generate 4 structured, realistic interview questions for a ${roundType} for the role "${jobTitle}".
Candidate skills: ${skills.join(", ") || "Fullstack development"}.
Return strictly a valid JSON array of objects with keys: "question", "category", "difficulty" (Easy/Medium/Hard), and "evaluationCriteria". Do not include Markdown blocks.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const rawText = response.text || "";
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const questions = JSON.parse(cleanJson);

        return res.status(200).json({
            success: true,
            questions,
        });
    } catch (error) {
        console.error("AI Interview Questions Error:", error);
        return res.status(200).json({
            success: true,
            questions: [
                {
                    question: "Explain the internal rendering lifecycle and optimization techniques in your primary stack.",
                    category: "Technical Knowledge",
                    difficulty: "Medium",
                    evaluationCriteria: "Clear explanation of virtual DOM/memoization/bundle splitting.",
                },
                {
                    question: "How do you design secure RESTful/GraphQL APIs with token rotation and rate limiting?",
                    category: "API & Security",
                    difficulty: "Medium",
                    evaluationCriteria: "Auth headers, JWT expiry, CSRF/CORS handling.",
                },
            ],
        });
    }
};
