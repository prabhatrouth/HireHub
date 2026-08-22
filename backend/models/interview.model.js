import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: false,
        },
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        interviewerType: {
            type: String,
            enum: ["recruiter", "assigned_panelist"],
            default: "recruiter",
        },
        assignedInterviewer: {
            name: { type: String, default: "" },
            email: { type: String, default: "" },
            role: { type: String, default: "" },
            department: { type: String, default: "" },
            notes: { type: String, default: "" },
            subUserId: { type: String, default: "" },
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
        },
        interviewDate: {
            type: String,
            required: true,
        },
        interviewTime: {
            type: String,
            required: true,
        },
        durationMinutes: {
            type: Number,
            default: 45,
        },
        roundType: {
            type: String,
            default: "Technical Round",
            enum: [
                "Initial Screening",
                "Technical Round",
                "Live Coding & DSA",
                "System Design",
                "Behavioral & HR Round",
                "Final Executive Round",
            ],
        },
        status: {
            type: String,
            enum: ["scheduled", "live", "completed", "cancelled"],
            default: "scheduled",
        },
        roomId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        meetingLink: {
            type: String,
        },
        notes: {
            type: String,
            default: "",
        },
        sharedCode: {
            type: String,
            default: "// Welcome to your live technical interview!\n// Write code below:\n\nfunction solution() {\n  console.log('HireHub Live Interview Session');\n}\n\nsolution();\n",
        },
        sharedLanguage: {
            type: String,
            default: "javascript",
        },
        chatMessages: [
            {
                senderId: { type: String },
                senderName: { type: String },
                senderRole: { type: String },
                text: { type: String },
                timestamp: { type: Date, default: Date.now },
            },
        ],
        evaluation: {
            rating: { type: Number, default: 0 },
            technicalScore: { type: Number, default: 0 },
            communicationScore: { type: Number, default: 0 },
            problemSolvingScore: { type: Number, default: 0 },
            cultureFitScore: { type: Number, default: 0 },
            hiringDecision: {
                type: String,
                enum: ["Strong Hire", "Hire", "Leaning Hire", "Leaning No Hire", "No Hire", "Undecided", "Next Round Recommended"],
                default: "Undecided",
            },
            interviewerFeedback: { type: String, default: "" },
            evaluatedAt: { type: Date },
        },
        panelistReport: {
            isSubmitted: { type: Boolean, default: false },
            submittedAt: { type: Date },
            submittedBy: {
                name: { type: String, default: "" },
                email: { type: String, default: "" },
                role: { type: String, default: "" },
            },
            technicalScore: { type: Number, default: 0 },
            problemSolvingScore: { type: Number, default: 0 },
            systemDesignScore: { type: Number, default: 0 },
            communicationScore: { type: Number, default: 0 },
            overallRating: { type: Number, default: 0 },
            strengths: { type: String, default: "" },
            weaknesses: { type: String, default: "" },
            keyHighlights: { type: String, default: "" },
            codeQualitySummary: { type: String, default: "" },
            panelistRecommendation: {
                type: String,
                enum: ["Strong Hire", "Hire", "Leaning Hire", "Leaning No Hire", "No Hire", "Advance to Next Round", "Undecided"],
                default: "Undecided",
            },
            detailedNotes: { type: String, default: "" },
        },
        recruiterFinalDecision: {
            isFinalized: { type: Boolean, default: false },
            finalDecision: {
                type: String,
                enum: ["Pending Review", "Hire", "Strong Hire", "Reject", "Advance to Next Round", "On Hold", "Re-evaluate"],
                default: "Pending Review",
            },
            finalRemarks: { type: String, default: "" },
            finalizedBy: {
                name: { type: String, default: "" },
                email: { type: String, default: "" },
            },
            finalizedAt: { type: Date },
            nextRoundScheduled: { type: Boolean, default: false },
            nextRoundType: { type: String, default: "" },
        },
        inspectionLogs: [
            {
                inspectedBy: {
                    name: { type: String },
                    email: { type: String },
                },
                inspectedAt: { type: Date, default: Date.now },
                notes: { type: String, default: "" },
            },
        ],
    },
    { timestamps: true }
);

export const Interview = mongoose.model("Interview", interviewSchema);
