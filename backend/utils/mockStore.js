import bcrypt from "bcryptjs";

const demoPasswordHash = bcrypt.hashSync("Demo@123", 10);

const mockStudents = [
    {
        _id: "student_1",
        fullname: "Amit Sharma",
        email: "amit.student@demo.com",
        phoneNumber: 9000000001,
        password: demoPasswordHash,
        role: "student",
        profile: {
            bio: "Frontend Developer experienced in React and Tailwind CSS.",
            skills: ["JavaScript", "React", "HTML", "CSS", "Tailwind"],
            profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            resume: "",
            resumeOriginalName: "",
        },
    },
    {
        _id: "student_2",
        fullname: "Rahul Das",
        email: "rahul.student@demo.com",
        phoneNumber: 9000000002,
        password: demoPasswordHash,
        role: "student",
        profile: {
            bio: "Full Stack Engineer specializing in Node.js, Express, and React.",
            skills: ["Node.js", "Express.js", "MongoDB", "React", "REST API"],
            profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            resume: "",
            resumeOriginalName: "",
        },
    }
];

const mockRecruiters = [
    {
        _id: "recruiter_1",
        fullname: "Rohan Mehta",
        email: "rohan.recruiter@demo.com",
        phoneNumber: 9100000001,
        password: demoPasswordHash,
        role: "recruiter",
        profile: {
            bio: "Lead Technical Recruiter at TechNova Solutions.",
            skills: ["Tech Hiring", "Talent Acquisition"],
            profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            resume: "",
            resumeOriginalName: "",
        },
    }
];

const mockCompanies = [
    {
        _id: "company_1",
        name: "TechNova Solutions",
        description: "Technology company developing modern software solutions and cloud infrastructure.",
        website: "https://technova.example.com",
        location: "Bengaluru",
        logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        userId: "recruiter_1",
        createdAt: new Date("2026-01-10").toISOString(),
    },
    {
        _id: "company_2",
        name: "DataSphere Analytics",
        description: "Leading enterprise data analytics and AI intelligence platform provider.",
        website: "https://datasphere.example.com",
        location: "Hyderabad",
        logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80",
        userId: "recruiter_1",
        createdAt: new Date("2026-01-15").toISOString(),
    },
    {
        _id: "company_3",
        name: "CloudBridge Technologies",
        description: "Next-generation cloud architectures and microservice deployment solutions.",
        website: "https://cloudbridge.example.com",
        location: "Pune",
        logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80",
        userId: "recruiter_1",
        createdAt: new Date("2026-01-20").toISOString(),
    }
];

const mockJobs = [
    {
        _id: "job_1",
        title: "Frontend Developer (React)",
        description: "We are looking for a passionate Frontend Developer with strong expertise in React, Redux, and modern CSS frameworks.",
        requirements: ["React", "JavaScript", "HTML", "CSS", "Tailwind"],
        salary: 12,
        experienceLevel: 2,
        location: "Bengaluru",
        jobType: "Full-time",
        position: 4,
        company: mockCompanies[0],
        created_by: "recruiter_1",
        applications: [],
        createdAt: new Date("2026-02-01").toISOString(),
    },
    {
        _id: "job_2",
        title: "Full Stack Engineer (MERN)",
        description: "Join our core product engineering team building high-scale real-time web applications using React and Node.js.",
        requirements: ["React", "Node.js", "Express.js", "MongoDB", "REST API"],
        salary: 18,
        experienceLevel: 3,
        location: "Hyderabad",
        jobType: "Full-time",
        position: 2,
        company: mockCompanies[1],
        created_by: "recruiter_1",
        applications: [],
        createdAt: new Date("2026-02-05").toISOString(),
    },
    {
        _id: "job_3",
        title: "Backend Developer (Node.js)",
        description: "Design and implement scalable backend microservices, robust API integrations, and secure database architectures.",
        requirements: ["Node.js", "Express.js", "MongoDB", "SQL", "Docker"],
        salary: 15,
        experienceLevel: 2,
        location: "Pune",
        jobType: "Full-time",
        position: 3,
        company: mockCompanies[2],
        created_by: "recruiter_1",
        applications: [],
        createdAt: new Date("2026-02-10").toISOString(),
    },
    {
        _id: "job_4",
        title: "Junior Software Engineer",
        description: "Great opportunity for fresh graduates and early career developers to learn and grow in a fast-paced technology environment.",
        requirements: ["JavaScript", "Python", "Problem Solving", "Git"],
        salary: 8,
        experienceLevel: 0,
        location: "Remote",
        jobType: "Full-time",
        position: 5,
        company: mockCompanies[0],
        created_by: "recruiter_1",
        applications: [],
        createdAt: new Date("2026-02-12").toISOString(),
    },
    {
        _id: "job_5",
        title: "UI/UX Designer & Developer",
        description: "Transform user workflows into intuitive, beautiful design systems, responsive wireframes, and production-ready components.",
        requirements: ["Figma", "UI Design", "UX Design", "HTML", "CSS", "React"],
        salary: 14,
        experienceLevel: 2,
        location: "Bengaluru",
        jobType: "Full-time",
        position: 2,
        company: mockCompanies[1],
        created_by: "recruiter_1",
        applications: [],
        createdAt: new Date("2026-02-14").toISOString(),
    }
];

const mockApplications = [];

export const mockStore = {
    users: [...mockStudents, ...mockRecruiters],
    companies: [...mockCompanies],
    jobs: [...mockJobs],
    applications: [...mockApplications],
};
