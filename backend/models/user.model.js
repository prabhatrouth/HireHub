import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:['student','recruiter'],
        required:true
    },
    profile:{
        bio:{type:String},
        skills:[{type:String}],
        resume:{type:String}, // URL to resume file
        resumeOriginalName:{type:String},
        company:{type:mongoose.Schema.Types.ObjectId, ref:'Company'}, 
        profilePhoto:{
            type:String,
            default:""
        }
    },
    isSubUser: {
        type: Boolean,
        default: false,
    },
    parentRecruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    subRole: {
        type: String,
        default: "",
    },
    department: {
        type: String,
        default: "",
    },
    specialty: [{ type: String }],
    permissions: {
        canViewAssignedInterviews: { type: Boolean, default: true },
        canConductInterview: { type: Boolean, default: true },
        canSubmitReport: { type: Boolean, default: true },
        canViewAllInterviews: { type: Boolean, default: false },
        canPostJobs: { type: Boolean, default: false },
        canViewAllApplicants: { type: Boolean, default: false },
        canManageCompanies: { type: Boolean, default: false },
        canFinalizeHiringDecision: { type: Boolean, default: false },
    },
    subUsers: [
        {
            name: { type: String, required: true },
            email: { type: String, required: true },
            password: { type: String },
            role: { type: String, default: "Technical Interviewer" },
            department: { type: String, default: "Engineering" },
            specialty: [{ type: String }],
            phone: { type: String, default: "" },
            permissions: {
                canViewAssignedInterviews: { type: Boolean, default: true },
                canConductInterview: { type: Boolean, default: true },
                canSubmitReport: { type: Boolean, default: true },
                canViewAllInterviews: { type: Boolean, default: false },
                canPostJobs: { type: Boolean, default: false },
                canViewAllApplicants: { type: Boolean, default: false },
                canManageCompanies: { type: Boolean, default: false },
                canFinalizeHiringDecision: { type: Boolean, default: false },
            },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now }
        }
    ],
},{timestamps:true});
export const User = mongoose.model('User', userSchema);