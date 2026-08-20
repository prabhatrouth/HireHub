import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import aiRoute from "./routes/ai.route.js";

dotenv.config({});

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://hire-hub-sigma-seven.vercel.app"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root health check endpoint
app.get("/", (req, res) => {
    return res.status(200).json({ message: "Backend is active", success: true });
});

// API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/ai", aiRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log(`Server running successfully on port ${PORT}`);
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
});