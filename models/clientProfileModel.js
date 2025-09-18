import mongoose from "mongoose";

const clientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  companyName:
   { type: String, 
    trim: true,
  default: ""},
  bio: {
    type: String,
    trim: true,
    default: ""
  },
  website: {
    type: String,
    trim: true,
    default: ""
  },
  profileImage: {
    type: String,
    default: ""
  }
}, { timestamps: true });

const clientProfile =
  mongoose.models.ClientProfile ||
  mongoose.model("ClientProfile", clientProfileSchema);

export default clientProfile;
