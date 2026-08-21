import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import aiRoute from "./routes/ai.route.js";

dotenv.config({});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../frontend");

const app = express();

// CORS Configuration - Permissive for dev server and preview iframes
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow all origins in development and iframe previews
            callback(null, true);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
);

app.options("*", cors());

// Body parsers & cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
    return res.status(200).json({
        message: "HireHub Backend is up and running!",
        success: true,
    });
});

// API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/ai", aiRoute);

// Global Error Handler for API routes
app.use((err, req, res, next) => {
    if (req.path.startsWith("/api/")) {
        console.error("API Server Error:", err.stack || err.message);
        return res.status(err.status || 500).json({
            message: err.message || "Internal Server Error",
            success: false,
        });
    }
    next(err);
});

// Vite Middleware (Dev) or Static Serve (Prod)
async function startServer() {
    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction) {
        try {
            const { createServer: createViteServer } = await import("vite");
            const vite = await createViteServer({
                root: frontendDir,
                server: {
                    middlewareMode: true,
                    hmr: false,
                },
                appType: "spa",
            });
            app.use(vite.middlewares);
            console.log("[HireHub] Vite dev middleware attached");
        } catch (viteErr) {
            console.error("Failed to start Vite middleware:", viteErr.message);
            // Fallback to static serving if dist exists
            const distPath = path.join(frontendDir, "dist");
            app.use(express.static(distPath));
            app.get("*", (req, res) => {
                res.sendFile(path.join(distPath, "index.html"));
            });
        }
    } else {
        const distPath = path.join(frontendDir, "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`HireHub server listening on http://0.0.0.0:${PORT}`);
        connectDB().catch((err) => {
            console.warn("Database connection failed on startup:", err.message);
        });
    });
}

startServer();
