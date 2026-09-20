import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Interview } from "../models/interview.model.js";
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
            const applications = await Application.find({ applicant: userId })
                .sort({ createdAt: -1 })
                .populate({
                    path: "job",
                    options: { sort: { createdAt: -1 } },
                    populate: {
                        path: "company",
                        options: { sort: { createdAt: -1 } },
                    },
                });

            // Auto-heal status if interview outcome exists
            if (applications && applications.length > 0) {
                for (let app of applications) {
                    if (app && app.status === "pending" && app.job) {
                        const interview = await Interview.findOne({
                            job: app.job._id || app.job,
                            candidate: userId,
                            status: "completed",
                        }).sort({ updatedAt: -1 });

                        if (interview) {
                            const dec = String(interview.recruiterFinalDecision?.finalDecision || interview.evaluation?.hiringDecision || "").toLowerCase();
                            const rec = String(interview.panelistReport?.panelistRecommendation || "").toLowerCase();

                            if (dec.includes("reject") || dec.includes("no hire") || rec.includes("no hire") || rec.includes("reject")) {
                                app.status = "rejected";
                                await Application.findByIdAndUpdate(app._id, { status: "rejected" });
                            } else if (dec.includes("hire") || dec.includes("accepted")) {
                                app.status = "accepted";
                                await Application.findByIdAndUpdate(app._id, { status: "accepted" });
                            }
                        }
                    }
                }
            }

            return res.status(200).json({
                application: applications || [],
                success: true,
            });
        } else {
            const userApps = mockStore.applications
                .filter((a) => String(a.applicant?._id || a.applicant) === String(userId))
                .map((app) => {
                    const job = mockStore.jobs.find((j) => String(j._id) === String(app.job));

                    // Auto-heal pending mock app if interview exists
                    if (app.status === "pending") {
                        const interview = (mockStore.interviews || []).find(
                            (i) => String(i.job?._id || i.job) === String(app.job) &&
                                   String(i.candidate?._id || i.candidate) === String(userId) &&
                                   i.status === "completed"
                        );
                        if (interview) {
                            const dec = String(interview.recruiterFinalDecision?.finalDecision || interview.evaluation?.hiringDecision || "").toLowerCase();
                            const rec = String(interview.panelistReport?.panelistRecommendation || "").toLowerCase();
                            if (dec.includes("reject") || dec.includes("no hire") || rec.includes("no hire") || rec.includes("reject")) {
                                app.status = "rejected";
                            } else if (dec.includes("hire") || dec.includes("accepted")) {
                                app.status = "accepted";
                            }
                        }
                    }

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
        const userId = req.id;

        let currentUser = null;
        if (isDbConnected()) {
            currentUser = await User.findById(userId);
        } else {
            currentUser = mockStore.users.find((u) => String(u._id) === String(userId)) || {};
        }

        if (currentUser?.isSubUser && !currentUser?.permissions?.canViewAllApplicants) {
            return res.status(403).json({
                message: "Access Denied: You do not have permission to view applicants.",
                success: false,
            });
        }

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

            // Auto-heal / sync application status if interview outcome is marked as Reject or Hire
            if (job.applications && job.applications.length > 0) {
                for (let app of job.applications) {
                    if (app && app.status === "pending" && app.applicant) {
                        const candidateId = app.applicant._id || app.applicant;
                        const interview = await Interview.findOne({
                            job: jobId,
                            candidate: candidateId,
                            status: "completed",
                        }).sort({ updatedAt: -1 });

                        if (interview) {
                            const dec = String(interview.recruiterFinalDecision?.finalDecision || interview.evaluation?.hiringDecision || "").toLowerCase();
                            const rec = String(interview.panelistReport?.panelistRecommendation || "").toLowerCase();

                            if (dec.includes("reject") || dec.includes("no hire") || rec.includes("no hire") || rec.includes("reject")) {
                                app.status = "rejected";
                                await Application.findByIdAndUpdate(app._id, { status: "rejected" });
                            } else if (dec.includes("hire") || dec.includes("accepted")) {
                                app.status = "accepted";
                                await Application.findByIdAndUpdate(app._id, { status: "accepted" });
                            }
                        }
                    }
                }
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

                    // Auto-heal status for mock store apps
                    if (a.status === "pending") {
                        const interview = (mockStore.interviews || []).find(
                            (i) => String(i.job?._id || i.job) === String(jobId) &&
                                   String(i.candidate?._id || i.candidate) === String(applicant._id || a.applicant) &&
                                   i.status === "completed"
                        );
                        if (interview) {
                            const dec = String(interview.recruiterFinalDecision?.finalDecision || interview.evaluation?.hiringDecision || "").toLowerCase();
                            const rec = String(interview.panelistReport?.panelistRecommendation || "").toLowerCase();
                            if (dec.includes("reject") || dec.includes("no hire") || rec.includes("no hire") || rec.includes("reject")) {
                                a.status = "rejected";
                            } else if (dec.includes("hire") || dec.includes("accepted")) {
                                a.status = "accepted";
                            }
                        }
                    }

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
        const userId = req.id;

        if (!status) {
            return res.status(400).json({
                message: "status is required",
                success: false,
            });
        }

        let currentUser = null;
        if (isDbConnected()) {
            currentUser = await User.findById(userId);
        } else {
            currentUser = mockStore.users.find((u) => String(u._id) === String(userId)) || {};
        }

        if (currentUser?.isSubUser && !currentUser?.permissions?.canFinalizeHiringDecision) {
            return res.status(403).json({
                message: "Access Denied: You do not have permission to change candidate hiring status.",
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
