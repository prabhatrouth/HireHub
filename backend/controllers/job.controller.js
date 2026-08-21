import { Job } from "../models/job.model.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

// admin post krega job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || experience === undefined || !position || !companyId) {
            return res.status(400).json({
                message: "Something is missing.",
                success: false,
            });
        }

        const reqsArray = typeof requirements === "string" ? requirements.split(",").map((r) => r.trim()) : requirements;

        if (isDbConnected()) {
            const job = await Job.create({
                title,
                description,
                requirements: reqsArray,
                salary: Number(salary),
                location,
                jobType,
                experienceLevel: Number(experience) || 0,
                position: Number(position) || 1,
                company: companyId,
                created_by: userId,
            });
            const populatedJob = await Job.findById(job._id).populate({ path: "company" });
            return res.status(201).json({
                message: "New job created successfully.",
                job: populatedJob || job,
                success: true,
            });
        } else {
            const company = mockStore.companies.find((c) => String(c._id) === String(companyId)) || {
                _id: companyId,
                name: "Tech Solutions",
                location,
            };
            const newJob = {
                _id: `job_${Date.now()}`,
                title,
                description,
                requirements: reqsArray,
                salary: Number(salary),
                location,
                jobType,
                experienceLevel: Number(experience) || 0,
                position: Number(position) || 1,
                company,
                created_by: userId,
                applications: [],
                createdAt: new Date().toISOString(),
            };
            mockStore.jobs.unshift(newJob);
            return res.status(201).json({
                message: "New job created successfully.",
                job: newJob,
                success: true,
            });
        }
    } catch (error) {
        console.error("Post Job Error:", error);
        return res.status(500).json({
            message: error.message || "Internal server error while posting job.",
            success: false,
        });
    }
};

// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";

        if (isDbConnected()) {
            const query = {
                $or: [
                    { title: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                ],
            };
            const jobs = await Job.find(query)
                .populate({ path: "company" })
                .sort({ createdAt: -1 });

            return res.status(200).json({
                jobs: jobs || [],
                success: true,
            });
        } else {
            const kw = keyword.toLowerCase();
            const populatedJobs = mockStore.jobs.map((j) => {
                let companyObj = j.company;
                if (typeof companyObj === "string") {
                    const foundComp = mockStore.companies.find(
                        (c) => String(c._id) === String(companyObj) || c.name.toLowerCase() === companyObj.toLowerCase()
                    );
                    companyObj = foundComp || { _id: companyObj, name: companyObj };
                } else if (companyObj && !companyObj.name && companyObj._id) {
                    const foundComp = mockStore.companies.find((c) => String(c._id) === String(companyObj._id));
                    if (foundComp) companyObj = foundComp;
                }
                return { ...j, company: companyObj };
            });

            const filteredJobs = populatedJobs.filter((j) =>
                !kw ||
                j.title?.toLowerCase().includes(kw) ||
                j.description?.toLowerCase().includes(kw) ||
                j.location?.toLowerCase().includes(kw) ||
                j.company?.name?.toLowerCase().includes(kw) ||
                (j.requirements && j.requirements.some((r) => r.toLowerCase().includes(kw)))
            );
            return res.status(200).json({
                jobs: filteredJobs,
                success: true,
            });
        }
    } catch (error) {
        console.error("Get All Jobs Error:", error);
        return res.status(200).json({
            jobs: mockStore.jobs || [],
            success: true,
        });
    }
};

// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;

        if (isDbConnected()) {
            let job = await Job.findById(jobId)
                .populate({ path: "applications" })
                .populate({ path: "company" });

            if (!job) {
                return res.status(404).json({
                    message: "Job not found.",
                    success: false,
                });
            }
            return res.status(200).json({ job, success: true });
        } else {
            const job = mockStore.jobs.find((j) => String(j._id) === String(jobId));
            if (!job) {
                return res.status(404).json({
                    message: "Job not found.",
                    success: false,
                });
            }

            let companyObj = job.company;
            if (typeof companyObj === "string") {
                const foundComp = mockStore.companies.find(
                    (c) => String(c._id) === String(companyObj) || c.name.toLowerCase() === companyObj.toLowerCase()
                );
                companyObj = foundComp || { _id: companyObj, name: companyObj };
            } else if (companyObj && !companyObj.name && companyObj._id) {
                const foundComp = mockStore.companies.find((c) => String(c._id) === String(companyObj._id));
                if (foundComp) companyObj = foundComp;
            }

            const completeJob = {
                ...job,
                company: companyObj,
            };

            return res.status(200).json({ job: completeJob, success: true });
        }
    } catch (error) {
        console.error("Get Job By Id Error:", error);
        return res.status(404).json({
            message: "Job not found.",
            success: false,
        });
    }
};

// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;

        if (isDbConnected()) {
            const jobs = await Job.find({ created_by: adminId })
                .populate({ path: "company" })
                .sort({ createdAt: -1 });

            return res.status(200).json({
                jobs: jobs || [],
                success: true,
            });
        } else {
            const adminJobs = mockStore.jobs
                .filter(
                    (j) => String(j.created_by) === String(adminId) || adminId === "recruiter_1"
                )
                .map((j) => {
                    let companyObj = j.company;
                    if (typeof companyObj === "string") {
                        const foundComp = mockStore.companies.find(
                            (c) => String(c._id) === String(companyObj) || c.name.toLowerCase() === companyObj.toLowerCase()
                        );
                        companyObj = foundComp || { _id: companyObj, name: companyObj };
                    } else if (companyObj && !companyObj.name && companyObj._id) {
                        const foundComp = mockStore.companies.find((c) => String(c._id) === String(companyObj._id));
                        if (foundComp) companyObj = foundComp;
                    }
                    return { ...j, company: companyObj };
                });

            return res.status(200).json({
                jobs: adminJobs,
                success: true,
            });
        }
    } catch (error) {
        console.error("Get Admin Jobs Error:", error);
        return res.status(200).json({
            jobs: [],
            success: true,
        });
    }
};
