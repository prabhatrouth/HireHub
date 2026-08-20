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

// Allowed Origins
const allowedOrigins = [
    "http://localhost:5173",
    "https://hire-hub-sigma-seven.vercel.app"
];

// CORS Configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like Postman, mobile apps, or health checks)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// 1. Enable CORS middleware (MUST be at the top)
app.use(cors(corsOptions));

// 2. Handle preflight OPTIONS requests across all routes
app.options("*", cors(corsOptions));

// 3. Body parsers & cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Health Check Endpoint (Prevents Render 503 "Service Unavailable")
app.get("/", (req, res) => {
    return res.status(200).json({
        message: "HireHub Backend is up and running!",
        success: true
    });
});

// 5. API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/ai", aiRoute);

// 6. Global Error Handler (Prevents crashes from dropping CORS headers)
app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack || err.message);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        success: false
    });
});

const PORT = process.env.PORT || 3000;

// 7. Start server immediately, then connect to Database
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    connectDB().catch((err) => {
        console.error("Database connection failed on startup:", err.message);
    });
});