import jobsModel from "../models/jobsModel.js";
import clientProfileModel from "../models/clientProfileModel.js";

//  Post Jobs by Client
const jobPosted = async (req, res) => {
  try {
    // ensure logged-in user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can post jobs",
      });
    }
    // find client profile
    const clientProfile = await clientProfileModel.findOne({
      user: req.user._id,
    });
    if (!clientProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Client profile not found" });
    }
    const job = new jobsModel({
      ...req.body,
      client: clientProfile._id, // tie job to the client
    });
    await job.save();
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  GET : List all jobs
const jobListing = async (req, res) => {
  try {
    const jobs = await jobsModel
      .find()
      .populate("client", "companyName website");
    res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });  
  }
};

//  GET jobs posting by :id
const getJobById = async (req, res) => {
  try {
    const job = await jobsModel
      .findById(req.params.id)
      .populate("client", "companyName website")
      .populate("applicants.freelancer", "bio skills hourlyRate");
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Edit/Update job content
const updateJob = async (req, res) => {
  try {
    //  find job by ID first
    const job = await jobsModel.findById(req.params.id);

    if (!job) {
      return res.json(404).json({
        success: false,
        message: "Job not found"
      });
    }
    //  check if the logged-in-user is the owner of the job
    if (job.client.toString() == req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this job"
      });
    }
    //  update the job
    const updatedJob = await jobsModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      success: true,
      data: updatedJob
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
};

//  Delete : Remove Job
const deleteJob = async (req, res) => {
  try {
    const job = await jobsModel.findOneAndDelete({
      _id: req.params.id,
      client: req.user._id, // only owner/ author can delete
    });

    if (!job) {
      return res.status(404).json({
        success: true,
        message: "Job not found or authorized",
      });
    }
    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { jobPosted, jobListing, getJobById, updateJob, deleteJob };
