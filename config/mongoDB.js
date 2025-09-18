import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MongoDB_URL, {
      dbName: "skillbridge",
    });
    console.log("✅ Mongo Database Connected...");
  } catch (err) {
    console.error("❌ Mongo Database connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
