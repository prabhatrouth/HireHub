import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false,
            });
        }

        if (isDbConnected()) {
            const existingApplication = await Application.findOne({ job: jobId, applicant: userId });
            if (existingApplication) {
                return res.status(400).json({
                    message: "You have already applied for this job",
                    success: false,
                });
            }

            const job = await Job.findById(jobId);
            if (!job) {
                return res.status(404).json({
                    message: "Job not found",
                    success: false,
                });
            }

            const newApplication = await Application.create({
                job: jobId,
                applicant: userId,
            });

            job.applications.push(newApplication._id);
            await job.save();

            return res.status(201).json({
                message: "Job applied successfully.",
                success: true,
            });
        } else {
            const existing = mockStore.applications.find(
                (a) => String(a.job) === String(jobId) && String(a.applicant) === String(userId)
            );
            if (existing) {
                return res.status(400).json({
                    message: "You have already applied for this job",
                    success: false,
                });
            }

            const job = mockStore.jobs.find((j) => String(j._id) === String(jobId));
            if (!job) {
                return res.status(404).json({
                    message: "Job not found",
                    success: false,
                });
            }

            const user = mockStore.users.find((u) => String(u._id) === String(userId));
            const newApp = {
                _id: `app_${Date.now()}`,
                job: jobId,
                applicant: user || { _id: userId, fullname: "Applicant", email: "student@demo.com" },
                status: "pending",
                createdAt: new Date().toISOString(),
            };
            mockStore.applications.push(newApp);
            if (!job.applications) job.applications = [];
            job.applications.push(newApp._id);

            return res.status(201).json({
                message: "Job applied successfully.",
                success: true,
            });
        }
    } catch (error) {
        console.error("Apply Job Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to apply for job.",
            success: false,
        });
    }
};

export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.id;

        if (isDbConnected()) {
            const application = await Application.find({ applicant: userId })
                .sort({ createdAt: -1 })
                .populate({
                    path: "job",
                    options: { sort: { createdAt: -1 } },
                    populate: {
                        path: "company",
                        options: { sort: { createdAt: -1 } },
                    },
                });

            return res.status(200).json({
                application: application || [],
                success: true,
            });
        } else {
            const userApps = mockStore.applications
                .filter((a) => String(a.applicant?._id || a.applicant) === String(userId))
                .map((app) => {
                    const job = mockStore.jobs.find((j) => String(j._id) === String(app.job));
                    return {
                        ...app,
                        job: job || { title: "Applied Position", company: { name: "Company" } },
                    };
                });

            return res.status(200).json({
                application: userApps,
                success: true,
            });
        }
    } catch (error) {
        console.error("Get Applied Jobs Error:", error);
        return res.status(200).json({
            application: [],
            success: true,
        });
    }
};

// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;

        if (isDbConnected()) {
            const job = await Job.findById(jobId).populate({
                path: "applications",
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: "applicant",
                },
            });
            if (!job) {
                return res.status(404).json({
                    message: "Job not found.",
                    success: false,
                });
            }
            return res.status(200).json({
                job,
                success: true,
            });
        } else {
            const job = mockStore.jobs.find((j) => String(j._id) === String(jobId));
            if (!job) {
                return res.status(404).json({
                    message: "Job not found.",
                    success: false,
                });
            }

            const apps = mockStore.applications
                .filter((a) => String(a.job) === String(jobId))
                .map((a) => {
                    const applicant = typeof a.applicant === "object"
                        ? a.applicant
                        : mockStore.users.find((u) => String(u._id) === String(a.applicant)) || { fullname: "Applicant" };
                    return { ...a, applicant };
                });

            return res.status(200).json({
                job: { ...job, applications: apps },
                success: true,
            });
        }
    } catch (error) {
        console.error("Get Applicants Error:", error);
        return res.status(404).json({
            message: "Applicants not found.",
            success: false,
        });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;
        if (!status) {
            return res.status(400).json({
                message: "status is required",
                success: false,
            });
        }

        if (isDbConnected()) {
            const application = await Application.findOne({ _id: applicationId });
            if (!application) {
                return res.status(404).json({
                    message: "Application not found.",
                    success: false,
                });
            }

            application.status = status.toLowerCase();
            await application.save();

            return res.status(200).json({
                message: "Status updated successfully.",
                success: true,
            });
        } else {
            const app = mockStore.applications.find((a) => String(a._id) === String(applicationId));
            if (!app) {
                return res.status(404).json({
                    message: "Application not found.",
                    success: false,
                });
            }
            app.status = status.toLowerCase();
            return res.status(200).json({
                message: "Status updated successfully.",
                success: true,
            });
        }
    } catch (error) {
        console.error("Update Status Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to update status.",
            success: false,
        });
    }
};
