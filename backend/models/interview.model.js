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
            hiringDecision: {
                type: String,
                enum: ["Strong Hire", "Hire", "Leaning Hire", "Leaning No Hire", "No Hire", "Undecided"],
                default: "Undecided",
            },
            interviewerFeedback: { type: String, default: "" },
            evaluatedAt: { type: Date },
        },
    },
    { timestamps: true }
);

export const Interview = mongoose.model("Interview", interviewSchema);
