import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { mockStore } from "../utils/mockStore.js";
import mongoose from "mongoose";

const isDbConnected = () => mongoose.connection.readyState === 1;

export const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false,
            });
        }

        if (isDbConnected()) {
            let company = await Company.findOne({ name: companyName });
            if (company) {
                return res.status(400).json({
                    message: "You can't register same company.",
                    success: false,
                });
            }
            company = await Company.create({
                name: companyName,
                userId: req.id,
            });

            return res.status(201).json({
                message: "Company registered successfully.",
                company,
                success: true,
            });
        } else {
            const existing = mockStore.companies.find(
                (c) => c.name?.toLowerCase() === companyName.toLowerCase()
            );
            if (existing) {
                return res.status(400).json({
                    message: "You can't register same company.",
                    success: false,
                });
            }
            const newCompany = {
                _id: `company_${Date.now()}`,
                name: companyName,
                description: "",
                website: "",
                location: "",
                logo: "",
                userId: req.id,
                createdAt: new Date().toISOString(),
            };
            mockStore.companies.push(newCompany);
            return res.status(201).json({
                message: "Company registered successfully.",
                company: newCompany,
                success: true,
            });
        }
    } catch (error) {
        console.error("Register Company Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to register company.",
            success: false,
        });
    }
};

export const getCompany = async (req, res) => {
    try {
        const userId = req.id; // logged in user id

        if (isDbConnected()) {
            const companies = await Company.find({ userId });
            return res.status(200).json({
                companies: companies || [],
                success: true,
            });
        } else {
            const userCompanies = mockStore.companies.filter(
                (c) => String(c.userId) === String(userId) || userId === "recruiter_1"
            );
            return res.status(200).json({
                companies: userCompanies,
                success: true,
            });
        }
    } catch (error) {
        console.error("Get Company Error:", error);
        return res.status(200).json({
            companies: [],
            success: true,
        });
    }
};

// get company by id
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;

        if (isDbConnected()) {
            const company = await Company.findById(companyId);
            if (!company) {
                return res.status(404).json({
                    message: "Company not found.",
                    success: false,
                });
            }
            return res.status(200).json({
                company,
                success: true,
            });
        } else {
            const company = mockStore.companies.find((c) => String(c._id) === String(companyId));
            if (!company) {
                return res.status(404).json({
                    message: "Company not found.",
                    success: false,
                });
            }
            return res.status(200).json({
                company,
                success: true,
            });
        }
    } catch (error) {
        console.error("Get Company By Id Error:", error);
        return res.status(404).json({
            message: "Company not found.",
            success: false,
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
        const file = req.file;

        let logo = undefined;
        if (file && process.env.CLOUD_NAME && process.env.API_KEY) {
            try {
                const fileUri = getDataUri(file);
                const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
                logo = cloudResponse.secure_url;
            } catch (cErr) {
                console.warn("Cloudinary company logo upload failed:", cErr.message);
            }
        }

        const updateData = { name, description, website, location };
        if (logo) updateData.logo = logo;

        if (isDbConnected()) {
            const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });
            if (!company) {
                return res.status(404).json({
                    message: "Company not found.",
                    success: false,
                });
            }
            return res.status(200).json({
                message: "Company information updated.",
                company,
                success: true,
            });
        } else {
            const company = mockStore.companies.find((c) => String(c._id) === String(req.params.id));
            if (!company) {
                return res.status(404).json({
                    message: "Company not found.",
                    success: false,
                });
            }
            if (name) company.name = name;
            if (description) company.description = description;
            if (website) company.website = website;
            if (location) company.location = location;
            if (logo) company.logo = logo;

            return res.status(200).json({
                message: "Company information updated.",
                company,
                success: true,
            });
        }
    } catch (error) {
        console.error("Update Company Error:", error);
        return res.status(500).json({
            message: error.message || "Failed to update company.",
            success: false,
        });
    }
};
