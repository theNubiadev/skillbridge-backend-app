import freelancerProfileModel from "../models/freelancerProfileModel.js";
import clientProfile from "../models/clientProfileModel.js";

//  update freelancer profile
const updateFreelancerProfile = async (req, res) => {
  try {
    const updates = req.body;
    const profile = await freelancerProfileModel
      .findOneAndUpdate(
        { user: req.user._id }, // match logged-in user
        { $set: updates },
        { new: true, runValidators: true, upsert: true }
      // upsert = create if not found
      )
      .populate("user", "name email role");
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// update client profile
const updateClientProfile = async (req, res) => {
  try { 
    const updates = req.body;
    const profile = await clientProfile
      .findOneAndUpdate(
        { user: req.user._id },
        { $set: updates },
        { new: true, runValidators: true, upsert: true }
      )
      .populate("user", "name email role");
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//  view freelancer profile
const viewFreeelancerProfile = async (req, res) => {
  try {
    const freelancer = await freelancerProfileModel
      .find()
      .populate("user", "name email");
    res.status(200).json({
      success: true,
      data: freelancer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//  view client profile
const viewClientProfile = async (req, res) => {
  try {
    const client = await clientProfile.find().populate("user", "name email");
    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  updateFreelancerProfile,
  updateClientProfile,
  viewClientProfile,
  viewFreeelancerProfile,
};
