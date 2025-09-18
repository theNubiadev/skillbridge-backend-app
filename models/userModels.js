import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["freelancer", "client"],
        default: "freelancer"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;
