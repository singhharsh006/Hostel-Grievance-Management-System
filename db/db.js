const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI not found in environment variables");
}

async function connectDB() {
    try {
        console.log("🔄 Connecting to MongoDB...");

        await mongoose.connect(MONGODB_URI);

        console.log("✅ MongoDB Connected Successfully");

    } catch (err) {
        console.error("❌ MongoDB Connection Error");
        console.error(err);
        process.exit(1);
    }
}

module.exports = { connectDB };