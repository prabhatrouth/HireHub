import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { User } from "./models/user.model.js";
import { Company } from "./models/company.model.js";
import { Job } from "./models/job.model.js";

dotenv.config();

const seedData = async () => {
    try {
        // =========================
        // CONNECT DATABASE
        // =========================

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        // =========================
        // CLEAR OLD DEMO DATA
        // =========================
        // Only deletes demo users, companies and jobs.
        // Your normal users are not deleted.

        await Job.deleteMany({});
        await Company.deleteMany({});

        await User.deleteMany({
            email: { $regex: /@demo\.com$/ }
        });

        console.log("Old demo data cleared");

        // =========================
        // PASSWORD
        // =========================

        const hashedPassword = await bcrypt.hash("Demo@123", 10);

        // =========================
        // STUDENTS
        // =========================

        const students = [
            {
                fullname: "Amit Sharma",
                email: "amit.student@demo.com",
                phoneNumber: 9000000001,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Rahul Das",
                email: "rahul.student@demo.com",
                phoneNumber: 9000000002,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Sneha Roy",
                email: "sneha.student@demo.com",
                phoneNumber: 9000000003,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Arjun Kumar",
                email: "arjun.student@demo.com",
                phoneNumber: 9000000004,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Priya Singh",
                email: "priya.student@demo.com",
                phoneNumber: 9000000005,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Rohit Mondal",
                email: "rohit.student@demo.com",
                phoneNumber: 9000000006,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Ananya Gupta",
                email: "ananya.student@demo.com",
                phoneNumber: 9000000007,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Sourav Ghosh",
                email: "sourav.student@demo.com",
                phoneNumber: 9000000008,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Neha Verma",
                email: "neha.student@demo.com",
                phoneNumber: 9000000009,
                password: hashedPassword,
                role: "student"
            },
            {
                fullname: "Karan Patel",
                email: "karan.student@demo.com",
                phoneNumber: 9000000010,
                password: hashedPassword,
                role: "student"
            }
        ];

        const createdStudents = await User.insertMany(students);

        console.log(`${createdStudents.length} students created`);

        // =========================
        // RECRUITERS
        // =========================

        const recruiters = [
            {
                fullname: "Rohan Mehta",
                email: "rohan.recruiter@demo.com",
                phoneNumber: 9100000001,
                password: hashedPassword,
                role: "recruiter"
            },
            {
                fullname: "Neha Kapoor",
                email: "neha.recruiter@demo.com",
                phoneNumber: 9100000002,
                password: hashedPassword,
                role: "recruiter"
            },
            {
                fullname: "Ankit Verma",
                email: "ankit.recruiter@demo.com",
                phoneNumber: 9100000003,
                password: hashedPassword,
                role: "recruiter"
            },
            {
                fullname: "Pooja Sharma",
                email: "pooja.recruiter@demo.com",
                phoneNumber: 9100000004,
                password: hashedPassword,
                role: "recruiter"
            },
            {
                fullname: "Vikram Singh",
                email: "vikram.recruiter@demo.com",
                phoneNumber: 9100000005,
                password: hashedPassword,
                role: "recruiter"
            }
        ];

        const createdRecruiters = await User.insertMany(recruiters);

        console.log(`${createdRecruiters.length} recruiters created`);

        // =========================
        // COMPANIES
        // =========================

        const companies = [
            {
                name: "TechNova Solutions",
                description:
                    "Technology company developing modern software solutions.",
                website: "https://technova.example.com",
                location: "Kolkata",
                logo: "",
                userId: createdRecruiters[0]._id
            },
            {
                name: "DataSphere Analytics",
                description:
                    "Data analytics and business intelligence company.",
                website: "https://datasphere.example.com",
                location: "Bengaluru",
                logo: "",
                userId: createdRecruiters[1]._id
            },
            {
                name: "CloudBridge Technologies",
                description:
                    "Cloud and enterprise software solutions provider.",
                website: "https://cloudbridge.example.com",
                location: "Hyderabad",
                logo: "",
                userId: createdRecruiters[2]._id
            },
            {
                name: "InnovateLabs",
                description:
                    "Product engineering and digital innovation company.",
                website: "https://innovatelabs.example.com",
                location: "Pune",
                logo: "",
                userId: createdRecruiters[3]._id
            },
            {
                name: "NextGen Systems",
                description:
                    "Software development and IT consulting company.",
                website: "https://nextgen.example.com",
                location: "Delhi",
                logo: "",
                userId: createdRecruiters[4]._id
            }
        ];

        const createdCompanies = await Company.insertMany(companies);

        console.log(`${createdCompanies.length} companies created`);

        // =========================
        // JOB DATA
        // =========================

        const jobTitles = [
            "MERN Stack Developer",
            "Frontend Developer",
            "Backend Developer",
            "Full Stack Developer",
            "React Developer",
            "Node.js Developer",
            "Java Developer",
            "Python Developer",
            "Software Engineer",
            "Data Analyst",
            "Data Scientist",
            "Machine Learning Engineer",
            "AI Engineer",
            "DevOps Engineer",
            "Cloud Engineer",
            "QA Engineer",
            "Software Testing Engineer",
            "UI/UX Designer",
            "Mobile App Developer",
            "Android Developer",
            "Cyber Security Analyst",
            "Business Analyst",
            "Database Developer",
            "System Administrator",
            "Technical Support Engineer"
        ];

        const locations = [
            "Kolkata",
            "Bengaluru",
            "Hyderabad",
            "Pune",
            "Mumbai",
            "Delhi",
            "Noida",
            "Gurugram",
            "Chennai",
            "Ahmedabad"
        ];

        const jobTypes = [
            "Full-time",
            "Part-time",
            "Internship",
            "Contract"
        ];

        const skills = [
            [
                "JavaScript",
                "React",
                "Node.js",
                "MongoDB"
            ],
            [
                "HTML",
                "CSS",
                "JavaScript",
                "React"
            ],
            [
                "Node.js",
                "Express.js",
                "MongoDB",
                "REST API"
            ],
            [
                "Java",
                "Spring Boot",
                "SQL",
                "OOP"
            ],
            [
                "Python",
                "Django",
                "Flask",
                "SQL"
            ],
            [
                "Python",
                "Pandas",
                "NumPy",
                "SQL"
            ],
            [
                "Python",
                "Machine Learning",
                "TensorFlow",
                "Pandas"
            ],
            [
                "AWS",
                "Docker",
                "Kubernetes",
                "CI/CD"
            ],
            [
                "SQL",
                "Excel",
                "Power BI",
                "Python"
            ],
            [
                "Figma",
                "UI Design",
                "UX Design",
                "Prototyping"
            ],
            [
                "Selenium",
                "Java",
                "API Testing",
                "SQL"
            ],
            [
                "Git",
                "GitHub",
                "JavaScript",
                "Problem Solving"
            ]
        ];

        // =========================
        // CREATE 100 JOBS
        // =========================

        const jobs = [];

        for (let i = 0; i < 100; i++) {

            const companyIndex =
                i % createdCompanies.length;

            const recruiterIndex =
                i % createdRecruiters.length;

            const title =
                jobTitles[i % jobTitles.length];

            const location =
                locations[i % locations.length];

            const jobType =
                jobTypes[i % jobTypes.length];

            const requirements =
                skills[i % skills.length];

            const salary =
                300000 + ((i % 10) * 50000);

            const experienceLevel =
                i % 4;

            jobs.push({
                title: title,

                description:
                    `We are looking for a talented ${title} ` +
                    `to join our team. The candidate will work ` +
                    `on real-world projects, collaborate with ` +
                    `experienced professionals and contribute ` +
                    `to building scalable software solutions.`,

                requirements: requirements,

                salary: salary,

                experienceLevel: experienceLevel,

                location: location,

                jobType: jobType,

                position: 1 + (i % 8),

                company:
                    createdCompanies[companyIndex]._id,

                created_by:
                    createdRecruiters[recruiterIndex]._id
            });
        }

        const createdJobs =
            await Job.insertMany(jobs);

        console.log(`${createdJobs.length} jobs created`);

        // =========================
        // FINISHED
        // =========================

        console.log("");
        console.log("====================================");
        console.log("DEMO DATA CREATED SUCCESSFULLY");
        console.log("====================================");
        console.log(`Students   : ${createdStudents.length}`);
        console.log(`Recruiters : ${createdRecruiters.length}`);
        console.log(`Companies  : ${createdCompanies.length}`);
        console.log(`Jobs       : ${createdJobs.length}`);
        console.log("====================================");
        console.log("Demo password: Demo@123");
        console.log("====================================");

        await mongoose.connection.close();

        process.exit(0);

    } catch (error) {

        console.error("SEED ERROR:");
        console.error(error);

        await mongoose.connection.close();

        process.exit(1);
    }
};

seedData();