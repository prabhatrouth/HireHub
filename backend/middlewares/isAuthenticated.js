import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "User session expired or not authenticated. Please log in.",
                sessionExpired: true,
                success: false,
            });
        }
        const secretKey = process.env.SECRET_KEY || "hirehub_default_secret_jwt_key_2026";
        const decode = jwt.verify(token, secretKey);
        if (!decode) {
            return res.status(401).json({
                message: "Session expired or invalid token. Please log in again.",
                sessionExpired: true,
                success: false,
            });
        }
        req.id = decode.userId;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        const isExpired = error.name === "TokenExpiredError" || error.message?.includes("expired");
        return res.status(401).json({
            message: isExpired
                ? "Your session has expired. Please log in again to continue."
                : "Authentication failed. Please log in again.",
            sessionExpired: true,
            success: false,
        });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        if (token) {
            const secretKey = process.env.SECRET_KEY || "hirehub_default_secret_jwt_key_2026";
            const decode = jwt.verify(token, secretKey);
            if (decode) {
                req.id = decode.userId;
            }
        }
    } catch {
        // Continue even if token is invalid or expired
    }
    next();
};

export default isAuthenticated;

