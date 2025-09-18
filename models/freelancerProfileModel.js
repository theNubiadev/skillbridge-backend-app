import mongoose from "mongoose";

const freelancenrProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      required: true,
      default: [],
    },
    portfolio: {
      type: String,
      trim: true,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
  },

  { timeStamps: true }
);

export default mongoose.model("FreelancerProfile", freelancenrProfileSchema);
