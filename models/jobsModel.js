import mongoose from "mongoose";
import freelancerProfileModel from "./freelancerProfileModel.js";

const jobsSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClientProfile", // who posted the job
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    requiredSkills: {
        type: [String],
        required: true,
        default: []
    },
    hourlyRate: {
        required: true,
        type: Number,
    },
    duration: {
        type: String,
        required: true
    },
    experienceLevel: {
        type: String,
        enum: ["beginner", "intermediate", "expert"],
        required: true
    },
    applicants: [
        {
            freelancer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: freelancerProfileModel,
            },
            coverLetter: String,
            appliedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    status: {
        type: String,
        enum: ["open", "in-progress", "completed", "closed"],
        default: "open",
    },
    time: {
        type: Date,
        default: Date.now
    }
})

const jobsModel = mongoose.models.Job ||  mongoose.model("Job", jobsSchema)

export default jobsModel;
