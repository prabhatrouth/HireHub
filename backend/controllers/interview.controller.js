import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Interview } from "../models/interview.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js";
import { GoogleGenAI } from "@google/genai";
import { mockStore } from "../utils/mockStore.js";

const isDbConnected = () => mongoose.connection.readyState === 1;

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

        // Generate clean unique room id (e.g. hh-tech-839f2a)
        const randomSlug = Math.random().toString(36).substring(2, 8);
        const prefix = roundType.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "meet";
        const roomId = `hh-${prefix}-${randomSlug}`;
        const meetingLink = `/interview/room/${roomId}`;

        const isRecruiterSelf = interviewerType === "recruiter";

        if (isDbConnected()) {
            const job = await Job.findById(jobId);
            if (!job) {
                return res.status(404).json({ message: "Job posting not found.", success: false });
            }

            const candidate = await User.findById(candidateId);
            if (!candidate) {
                return res.status(404).json({ message: "Candidate profile not found.", success: false });
            }

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
                    role: assignedInterviewer.role || (isRecruiterSelf ? "Lead Recruiter" : "Technical Interviewer"),
                    department: assignedInterviewer.department || "",
                    notes: assignedInterviewer.notes || "",
                    subUserId: assignedInterviewer.subUserId || "",
                    userId: assignedInterviewer.userId || undefined,
                },
                panelistReport: {
                    isSubmitted: false,
                },
                recruiterFinalDecision: {
                    isFinalized: false,
                    finalDecision: "Pending Review",
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
        } else {
            // Mock store fallback
            const job = mockStore.jobs.find((j) => String(j._id) === String(jobId)) || mockStore.jobs[0];
            const candidate = mockStore.users.find((u) => String(u._id) === String(candidateId)) || mockStore.users[0];
            const recruiter = mockStore.users.find((u) => String(u._id) === String(recruiterId)) || mockStore.users[2];

            const mockNewInterview = {
                _id: `interview_${Date.now()}`,
                job,
                candidate,
                recruiter,
                company: job?.company || mockStore.companies[0],
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
                    name: assignedInterviewer.name || (isRecruiterSelf ? recruiter.fullname : "Alex Rivera"),
                    email: assignedInterviewer.email || (isRecruiterSelf ? recruiter.email : "alex.rivera@eng.company.com"),
                    role: assignedInterviewer.role || (isRecruiterSelf ? "Lead Recruiter" : "Technical Interviewer"),
                    department: assignedInterviewer.department || "Engineering",
                    notes: assignedInterviewer.notes || "",
                    subUserId: assignedInterviewer.subUserId || "subuser_1",
                    userId: assignedInterviewer.userId || "subuser_1_user",
                },
                panelistReport: {
                    isSubmitted: false,
                },
                recruiterFinalDecision: {
                    isFinalized: false,
                    finalDecision: "Pending Review",
                },
                sharedCode: "// Live Code Workspace\n",
                sharedLanguage: "javascript",
                chatMessages: [],
                createdAt: new Date().toISOString(),
            };

            if (!mockStore.interviews) mockStore.interviews = [];
            mockStore.interviews.unshift(mockNewInterview);

            return res.status(201).json({
                message: `Interview scheduled with ${candidate?.fullname || "Candidate"} for ${interviewDate} at ${interviewTime}`,
                success: true,
                interview: mockNewInterview,
            });
        }
    } catch (error) {
        console.error("Schedule Interview Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to schedule interview.",
            success: false,
        });
    }
};

// 2. Get all interviews for current user (candidate, recruiter, or sub-user / technical interviewer)
export const getMyInterviews = async (req, res) => {
    try {
        const userId = req.id;

        if (isDbConnected()) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found.", success: false });
            }

            let query = {};
            if (user.role === "recruiter") {
                if (user.isSubUser) {
                    // Technical / delegated sub-user:
                    // If they have full visibility permission, they can view all parent recruiter's interviews
                    if (user.permissions?.canViewAllInterviews) {
                        query = { recruiter: user.parentRecruiter || userId };
                    } else {
                        // Otherwise only show interviews assigned to them
                        query = {
                            $or: [
                                { "assignedInterviewer.email": user.email.toLowerCase() },
                                { "assignedInterviewer.subUserId": String(user._id) },
                                { "assignedInterviewer.userId": user._id },
                            ],
                        };
                    }
                } else {
                    // Master Recruiter sees all interviews they created or are parent of
                    query = { recruiter: userId };
                }
            } else {
                // Candidate
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
        } else {
            // Mock store fallback
            const user = mockStore.users.find((u) => String(u._id) === String(userId)) || mockStore.users[0];
            const allInterviews = mockStore.interviews || [];

            let filtered = [];
            if (user.role === "recruiter") {
                if (user.isSubUser) {
                    if (user.permissions?.canViewAllInterviews) {
                        filtered = allInterviews;
                    } else {
                        filtered = allInterviews.filter((i) => {
                            const assignee = i.assignedInterviewer || {};
                            return (
                                assignee.email?.toLowerCase() === user.email?.toLowerCase() ||
                                String(assignee.userId) === String(user._id) ||
                                String(assignee.subUserId) === String(user._id)
                            );
                        });
                    }
                } else {
                    // Master recruiter sees all
                    filtered = allInterviews;
                }
            } else {
                // Candidate sees their own interviews
                filtered = allInterviews.filter((i) => String(i.candidate?._id) === String(user._id) || String(i.candidate) === String(user._id));
            }

            return res.status(200).json({
                success: true,
                interviews: filtered,
            });
        }
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
        const userId = req.id;

        if (isDbConnected()) {
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

            const user = await User.findById(userId);
            const isRecruiterOwner = user && String(interview.recruiter?._id) === String(userId);
            const isAssignedInterviewer = user && (
                interview.assignedInterviewer?.email?.toLowerCase() === user.email?.toLowerCase() ||
                String(interview.assignedInterviewer?.userId) === String(userId) ||
                String(interview.assignedInterviewer?.subUserId) === String(userId)
            );
            const isCandidate = user && String(interview.candidate?._id) === String(userId);

            // Inspection mode: Master recruiter joining an interview assigned to a technical panelist
            const isInspectionMode = isRecruiterOwner && interview.interviewerType === "assigned_panelist" && !isAssignedInterviewer;

            return res.status(200).json({
                success: true,
                interview,
                userRoleInRoom: isCandidate ? "candidate" : isAssignedInterviewer ? "assigned_interviewer" : isRecruiterOwner ? "recruiter_owner" : "guest",
                isInspectionMode,
                canSubmitReport: isAssignedInterviewer || isRecruiterOwner,
                canFinalizeDecision: isRecruiterOwner || user?.permissions?.canFinalizeHiringDecision,
            });
        } else {
            // Mock store
            const interview = (mockStore.interviews || []).find((i) => i.roomId === roomId);
            if (!interview) {
                return res.status(404).json({
                    message: "Interview room not found or link has expired.",
                    success: false,
                });
            }

            const user = (mockStore.users || []).find((u) => String(u._id) === String(userId)) || {};
            const isRecruiterOwner = String(interview.recruiter?._id || interview.recruiter) === String(userId) || user.role === "recruiter" && !user.isSubUser;
            const isAssignedInterviewer = (
                interview.assignedInterviewer?.email?.toLowerCase() === user.email?.toLowerCase() ||
                String(interview.assignedInterviewer?.userId) === String(userId)
            );
            const isCandidate = String(interview.candidate?._id || interview.candidate) === String(userId) || user.role === "student";

            const isInspectionMode = isRecruiterOwner && interview.interviewerType === "assigned_panelist" && !isAssignedInterviewer;

            return res.status(200).json({
                success: true,
                interview,
                userRoleInRoom: isCandidate ? "candidate" : isAssignedInterviewer ? "assigned_interviewer" : isRecruiterOwner ? "recruiter_owner" : "guest",
                isInspectionMode,
                canSubmitReport: isAssignedInterviewer || isRecruiterOwner,
                canFinalizeDecision: isRecruiterOwner || user?.permissions?.canFinalizeHiringDecision,
            });
        }
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

        if (isDbConnected()) {
            const interview = await Interview.findOneAndUpdate(
                { roomId },
                { status },
                { new: true }
            )
                .populate("candidate", "fullname email phoneNumber profile")
                .populate("recruiter", "fullname email")
                .populate("job", "title location salary");

            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }

            return res.status(200).json({
                message: `Interview status updated to ${status}`,
                success: true,
                interview,
            });
        } else {
            const interview = (mockStore.interviews || []).find((i) => i.roomId === roomId);
            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }
            interview.status = status;
            return res.status(200).json({
                message: `Interview status updated to ${status}`,
                success: true,
                interview,
            });
        }
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

        if (isDbConnected()) {
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
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }

            return res.status(200).json({
                success: true,
                sharedCode: interview.sharedCode,
                sharedLanguage: interview.sharedLanguage,
                chatMessages: interview.chatMessages,
            });
        } else {
            const interview = (mockStore.interviews || []).find((i) => i.roomId === roomId);
            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }
            if (sharedCode !== undefined) interview.sharedCode = sharedCode;
            if (sharedLanguage !== undefined) interview.sharedLanguage = sharedLanguage;
            if (chatMessage && chatMessage.text) {
                if (!interview.chatMessages) interview.chatMessages = [];
                interview.chatMessages.push({
                    senderId: req.id || "guest",
                    senderName: chatMessage.senderName || "Participant",
                    senderRole: chatMessage.senderRole || "candidate",
                    text: chatMessage.text,
                    timestamp: new Date().toISOString(),
                });
            }
            return res.status(200).json({
                success: true,
                sharedCode: interview.sharedCode,
                sharedLanguage: interview.sharedLanguage,
                chatMessages: interview.chatMessages,
            });
        }
    } catch (error) {
        console.error("Update Workspace Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to update room workspace.",
            success: false,
        });
    }
};

// 6. Submit Panelist / Technical Interviewer Report (or Recruiter self-evaluation)
export const submitEvaluation = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.id;
        const {
            technicalScore = 0,
            problemSolvingScore = 0,
            systemDesignScore = 0,
            communicationScore = 0,
            cultureFitScore = 0,
            overallRating = 0,
            strengths = "",
            weaknesses = "",
            keyHighlights = "",
            codeQualitySummary = "",
            panelistRecommendation = "Undecided",
            detailedNotes = "",
            interviewerFeedback = "",
            hiringDecision = "Undecided",
            // If recruiter self-took the interview or finalized directly
            isRecruiterDirectFinalize = false,
            finalDecision,
            finalRemarks,
            advanceApplicationStatus,
        } = req.body;

        const calculatedRating = Number(overallRating) || Math.round(
            (Number(technicalScore) + Number(problemSolvingScore) + Number(communicationScore) + Number(cultureFitScore || systemDesignScore || 0)) / 4
        ) || 0;

        let currentUser = null;
        if (isDbConnected()) {
            currentUser = await User.findById(userId);
        } else {
            currentUser = mockStore.users.find((u) => String(u._id) === String(userId)) || {};
        }

        const isMasterRecruiter = currentUser?.role === "recruiter" && !currentUser?.isSubUser;

        const panelistReportData = {
            isSubmitted: true,
            submittedAt: new Date(),
            submittedBy: {
                name: currentUser?.fullname || "Interviewer",
                email: currentUser?.email || "",
                role: currentUser?.subRole || (isMasterRecruiter ? "Lead Recruiter" : "Technical Interviewer"),
            },
            technicalScore: Number(technicalScore),
            problemSolvingScore: Number(problemSolvingScore),
            systemDesignScore: Number(systemDesignScore),
            communicationScore: Number(communicationScore),
            overallRating: calculatedRating,
            strengths,
            weaknesses,
            keyHighlights,
            codeQualitySummary,
            panelistRecommendation: panelistRecommendation || hiringDecision || "Undecided",
            detailedNotes: detailedNotes || interviewerFeedback,
        };

        const evaluationData = {
            rating: calculatedRating,
            technicalScore: Number(technicalScore),
            communicationScore: Number(communicationScore),
            problemSolvingScore: Number(problemSolvingScore),
            cultureFitScore: Number(cultureFitScore),
            hiringDecision: hiringDecision || panelistRecommendation || "Undecided",
            interviewerFeedback: interviewerFeedback || detailedNotes,
            evaluatedAt: new Date(),
        };

        if (isDbConnected()) {
            const interview = await Interview.findOne({ roomId });
            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }

            interview.panelistReport = panelistReportData;
            interview.evaluation = evaluationData;
            interview.status = "completed";

            // If master recruiter self-conducted the interview OR explicitly finalized:
            if (isRecruiterDirectFinalize || interview.interviewerType === "recruiter" || isMasterRecruiter) {
                const decisionToSet = finalDecision || (
                    ["Strong Hire", "Hire"].includes(panelistRecommendation) ? "Hire" :
                    ["No Hire", "Leaning No Hire"].includes(panelistRecommendation) ? "Reject" :
                    panelistRecommendation === "Advance to Next Round" ? "Advance to Next Round" : "Hire"
                );

                interview.recruiterFinalDecision = {
                    isFinalized: true,
                    finalDecision: decisionToSet,
                    finalRemarks: finalRemarks || `Finalized by Lead Recruiter ${currentUser?.fullname || ""}: ${detailedNotes || interviewerFeedback}`,
                    finalizedBy: {
                        name: currentUser?.fullname || "Lead Recruiter",
                        email: currentUser?.email || "",
                    },
                    finalizedAt: new Date(),
                };
            }

            await interview.save();

            // Advance application status if specified
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
                message: isRecruiterDirectFinalize || interview.interviewerType === "recruiter"
                    ? "Evaluation completed and Final Hiring Decision confirmed!"
                    : "Technical interview report submitted to recruiter for final review!",
                success: true,
                interview: updatedInterview,
            });
        } else {
            const interview = (mockStore.interviews || []).find((i) => i.roomId === roomId);
            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }

            interview.panelistReport = panelistReportData;
            interview.evaluation = evaluationData;
            interview.status = "completed";

            if (isRecruiterDirectFinalize || interview.interviewerType === "recruiter" || isMasterRecruiter) {
                interview.recruiterFinalDecision = {
                    isFinalized: true,
                    finalDecision: finalDecision || "Hire",
                    finalRemarks: finalRemarks || `Finalized directly: ${detailedNotes}`,
                    finalizedBy: {
                        name: currentUser?.fullname || "Lead Recruiter",
                        email: currentUser?.email || "",
                    },
                    finalizedAt: new Date().toISOString(),
                };
            }

            return res.status(200).json({
                message: isRecruiterDirectFinalize || interview.interviewerType === "recruiter"
                    ? "Evaluation completed and Final Hiring Decision confirmed!"
                    : "Technical interview report submitted to recruiter for final review!",
                success: true,
                interview,
            });
        }
    } catch (error) {
        console.error("Submit Evaluation Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to save evaluation scorecard.",
            success: false,
        });
    }
};

// 7. Finalize Recruiter Decision on Submitted Report
export const finalizeRecruiterDecision = async (req, res) => {
    try {
        const { roomId } = req.params;
        const recruiterId = req.id;
        const {
            finalDecision = "Hire",
            finalRemarks = "",
            advanceApplicationStatus,
            scheduleNextRound = false,
            nextRoundType = "Managerial Round",
        } = req.body;

        let recruiterUser = null;
        if (isDbConnected()) {
            recruiterUser = await User.findById(recruiterId);
        } else {
            recruiterUser = mockStore.users.find((u) => String(u._id) === String(recruiterId)) || {};
        }

        const finalDecisionData = {
            isFinalized: true,
            finalDecision,
            finalRemarks,
            finalizedBy: {
                name: recruiterUser?.fullname || "Lead Recruiter",
                email: recruiterUser?.email || "",
            },
            finalizedAt: new Date(),
            nextRoundScheduled: Boolean(scheduleNextRound),
            nextRoundType: scheduleNextRound ? nextRoundType : "",
        };

        if (isDbConnected()) {
            const interview = await Interview.findOne({ roomId });
            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }

            interview.recruiterFinalDecision = finalDecisionData;
            if (interview.status !== "completed") {
                interview.status = "completed";
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
                message: `Final hiring decision recorded as: ${finalDecision}!`,
                success: true,
                interview: updatedInterview,
            });
        } else {
            const interview = (mockStore.interviews || []).find((i) => i.roomId === roomId);
            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }

            interview.recruiterFinalDecision = finalDecisionData;
            interview.status = "completed";

            return res.status(200).json({
                message: `Final hiring decision recorded as: ${finalDecision}!`,
                success: true,
                interview,
            });
        }
    } catch (error) {
        console.error("Finalize Recruiter Decision Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to finalize decision.",
            success: false,
        });
    }
};

// 8. Log Recruiter Inspection (Recruiter observing live technical interview)
export const logRecruiterInspection = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.id;
        const { notes = "" } = req.body;

        let user = null;
        if (isDbConnected()) {
            user = await User.findById(userId);
        } else {
            user = mockStore.users.find((u) => String(u._id) === String(userId)) || {};
        }

        const logEntry = {
            inspectedBy: {
                name: user?.fullname || "Recruiter",
                email: user?.email || "",
            },
            inspectedAt: new Date(),
            notes: notes || "Recruiter joined active session for quality & interview inspection.",
        };

        if (isDbConnected()) {
            const interview = await Interview.findOneAndUpdate(
                { roomId },
                { $push: { inspectionLogs: logEntry } },
                { new: true }
            );

            return res.status(200).json({
                message: "Inspection log recorded.",
                success: true,
                inspectionLogs: interview?.inspectionLogs || [logEntry],
            });
        } else {
            const interview = (mockStore.interviews || []).find((i) => i.roomId === roomId);
            if (interview) {
                if (!interview.inspectionLogs) interview.inspectionLogs = [];
                interview.inspectionLogs.push(logEntry);
            }
            return res.status(200).json({
                message: "Inspection log recorded.",
                success: true,
                inspectionLogs: interview?.inspectionLogs || [logEntry],
            });
        }
    } catch (error) {
        console.error("Inspection Log Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to log inspection.",
            success: false,
        });
    }
};

// 9. Complete interview with quick status or remarks
export const completeInterview = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { notes = "", hiringDecision, advanceApplicationStatus } = req.body;

        if (isDbConnected()) {
            const interview = await Interview.findOne({ roomId });
            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
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
        } else {
            const interview = (mockStore.interviews || []).find((i) => i.roomId === roomId);
            if (!interview) {
                return res.status(404).json({ message: "Interview room not found.", success: false });
            }
            interview.status = "completed";
            if (hiringDecision) interview.evaluation.hiringDecision = hiringDecision;
            return res.status(200).json({
                message: "Interview marked as completed successfully.",
                success: true,
                interview,
            });
        }
    } catch (error) {
        console.error("Complete Interview Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to complete interview.",
            success: false,
        });
    }
};

// 10. Sub-Users / Technical Interviewers Management for Recruiter
export const getSubUsers = async (req, res) => {
    try {
        const recruiterId = req.id;

        if (isDbConnected()) {
            const recruiter = await User.findById(recruiterId);
            if (!recruiter) {
                return res.status(404).json({ message: "Recruiter not found.", success: false });
            }

            let subUsers = recruiter.subUsers || [];
            if (subUsers.length === 0) {
                const initialMembers = [
                    {
                        name: "Alex Rivera",
                        email: "alex.rivera@eng.company.com",
                        role: "Staff Backend Engineer",
                        department: "Distributed Systems & Cloud",
                        specialty: ["Node.js", "Go", "Kubernetes", "System Design"],
                        phone: "+1-555-0192",
                        permissions: {
                            canViewAssignedInterviews: true,
                            canConductInterview: true,
                            canSubmitReport: true,
                            canViewAllInterviews: false,
                            canPostJobs: false,
                            canViewAllApplicants: false,
                            canManageCompanies: false,
                            canFinalizeHiringDecision: false,
                        },
                        createdAt: new Date(),
                    },
                    {
                        name: "Priya Nair",
                        email: "priya.nair@eng.company.com",
                        role: "Senior Frontend Architect",
                        department: "Web Platform & UI Core",
                        specialty: ["React", "TypeScript", "Performance", "CSS/Web Standards"],
                        phone: "+1-555-0144",
                        permissions: {
                            canViewAssignedInterviews: true,
                            canConductInterview: true,
                            canSubmitReport: true,
                            canViewAllInterviews: false,
                            canPostJobs: false,
                            canViewAllApplicants: false,
                            canManageCompanies: false,
                            canFinalizeHiringDecision: false,
                        },
                        createdAt: new Date(),
                    },
                ];
                recruiter.subUsers = initialMembers;
                await recruiter.save();
                subUsers = recruiter.subUsers;
            }

            return res.status(200).json({
                success: true,
                subUsers,
            });
        } else {
            const recruiter = mockStore.users.find((u) => String(u._id) === String(recruiterId)) || mockStore.users[2];
            return res.status(200).json({
                success: true,
                subUsers: recruiter?.subUsers || [],
            });
        }
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
        const {
            name,
            email,
            password = "Demo@123",
            role = "Technical Interviewer",
            department = "Engineering",
            specialty = ["Coding", "System Design"],
            phone = "",
            permissions = {},
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and Email are required for team member / technical interviewer.",
                success: false,
            });
        }

        const effectivePermissions = {
            canViewAssignedInterviews: permissions.canViewAssignedInterviews !== false,
            canConductInterview: permissions.canConductInterview !== false,
            canSubmitReport: permissions.canSubmitReport !== false,
            canViewAllInterviews: Boolean(permissions.canViewAllInterviews),
            canPostJobs: Boolean(permissions.canPostJobs),
            canViewAllApplicants: Boolean(permissions.canViewAllApplicants),
            canManageCompanies: Boolean(permissions.canManageCompanies),
            canFinalizeHiringDecision: Boolean(permissions.canFinalizeHiringDecision),
        };

        const hashedPassword = await bcrypt.hash(password || "Demo@123", 10);

        if (isDbConnected()) {
            const recruiter = await User.findById(recruiterId);
            if (!recruiter) {
                return res.status(404).json({ message: "Recruiter not found.", success: false });
            }

            // Create or update dedicated User account for this technical interviewer
            let subUserAccount = await User.findOne({ email: email.toLowerCase() });
            if (!subUserAccount) {
                subUserAccount = await User.create({
                    fullname: name,
                    email: email.toLowerCase(),
                    phoneNumber: Number(phone.replace(/\D/g, "")) || 9100000099,
                    password: hashedPassword,
                    role: "recruiter",
                    isSubUser: true,
                    parentRecruiter: recruiterId,
                    subRole: role,
                    department,
                    specialty: Array.isArray(specialty) ? specialty : [specialty],
                    permissions: effectivePermissions,
                    profile: {
                        bio: `${role} - ${department}`,
                        skills: Array.isArray(specialty) ? specialty : [specialty],
                        profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                    },
                });
            } else {
                subUserAccount.isSubUser = true;
                subUserAccount.parentRecruiter = recruiterId;
                subUserAccount.subRole = role;
                subUserAccount.department = department;
                subUserAccount.permissions = effectivePermissions;
                await subUserAccount.save();
            }

            const newSubUser = {
                name,
                email: email.toLowerCase(),
                password: password || "Demo@123",
                role,
                department,
                specialty: Array.isArray(specialty)
                    ? specialty
                    : specialty ? specialty.split(",").map((s) => s.trim()) : ["Coding", "System Design"],
                phone,
                permissions: effectivePermissions,
                userId: subUserAccount._id,
                createdAt: new Date(),
            };

            recruiter.subUsers.push(newSubUser);
            await recruiter.save();

            return res.status(201).json({
                message: `Team member ${name} (${role}) added successfully with custom permissions.`,
                success: true,
                subUsers: recruiter.subUsers,
                newSubUser: recruiter.subUsers[recruiter.subUsers.length - 1],
            });
        } else {
            // Mock store
            const recruiter = mockStore.users.find((u) => String(u._id) === String(recruiterId)) || mockStore.users[2];
            const newSubId = `subuser_${Date.now()}`;
            const newSubUserId = `${newSubId}_user`;

            const newSubUser = {
                _id: newSubId,
                name,
                email: email.toLowerCase(),
                password: password || "Demo@123",
                role,
                department,
                specialty: Array.isArray(specialty) ? specialty : [specialty],
                phone,
                permissions: effectivePermissions,
                userId: newSubUserId,
                createdAt: new Date().toISOString(),
            };

            if (!recruiter.subUsers) recruiter.subUsers = [];
            recruiter.subUsers.push(newSubUser);

            // Also add mock user account
            const newMockUser = {
                _id: newSubUserId,
                fullname: name,
                email: email.toLowerCase(),
                phoneNumber: 9100000099,
                password: hashedPassword,
                role: "recruiter",
                isSubUser: true,
                parentRecruiter: recruiterId,
                subRole: role,
                department,
                specialty: Array.isArray(specialty) ? specialty : [specialty],
                permissions: effectivePermissions,
                profile: {
                    bio: `${role} - ${department}`,
                    skills: Array.isArray(specialty) ? specialty : [specialty],
                    profilePhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                },
            };
            mockStore.users.push(newMockUser);

            return res.status(201).json({
                message: `Team member ${name} (${role}) added successfully with custom permissions.`,
                success: true,
                subUsers: recruiter.subUsers,
                newSubUser,
            });
        }
    } catch (error) {
        console.error("Add SubUser Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to add team member.",
            success: false,
        });
    }
};

export const deleteSubUser = async (req, res) => {
    try {
        const recruiterId = req.id;
        const { subUserId } = req.params;

        if (isDbConnected()) {
            const recruiter = await User.findById(recruiterId);
            if (!recruiter) {
                return res.status(404).json({ message: "Recruiter not found.", success: false });
            }

            recruiter.subUsers = recruiter.subUsers.filter(
                (u) => u._id.toString() !== subUserId
            );
            await recruiter.save();

            return res.status(200).json({
                message: "Team member removed.",
                success: true,
                subUsers: recruiter.subUsers,
            });
        } else {
            const recruiter = mockStore.users.find((u) => String(u._id) === String(recruiterId)) || mockStore.users[2];
            if (recruiter && recruiter.subUsers) {
                recruiter.subUsers = recruiter.subUsers.filter((u) => String(u._id) !== String(subUserId));
            }
            return res.status(200).json({
                message: "Team member removed.",
                success: true,
                subUsers: recruiter?.subUsers || [],
            });
        }
    } catch (error) {
        console.error("Delete SubUser Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to delete team member.",
            success: false,
        });
    }
};

// 11. AI Interview Assistant - Generate tailored live interview questions
export const generateAIQuestions = async (req, res) => {
    try {
        const { jobTitle = "Software Engineer", skills = [], roundType = "Technical Round" } = req.body;

        const ai = getGeminiClient();
        if (!ai) {
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
