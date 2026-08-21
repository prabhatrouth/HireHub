import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.set("bufferCommands", false);
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.warn("[HireHub] MONGO_URI not provided. Running in-memory / fallback mode.");
            return;
        }
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.warn("MongoDB connection failed:", error.message);
    }
};

export default connectDB;
