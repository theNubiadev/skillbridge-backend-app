import jobsModel from "../models/jobsModel.js";
import clientProfileModel from "../models/clientProfileModel.js";
import freelancerProfileModel from "../models/freelancerProfileModel.js";

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
        message: "Job not found",
      });
    }
    //  check if the logged-in-user is the owner of the job
    if (job.client.toString() == req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this job",
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
      data: updatedJob,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

//  GET apply for jobs
const jobApplication = async (req, res) => {
  try {
    //  find job by id
    const job = await jobsModel.findById(req.params.id);
    if (!job) {
      return res.json(404).json({
        success: false,
        message: "Job not found",
      });
    }
    //  this block ensures only freelancers can apply to jobs
    if (req.user.role !== "freelancer") {
      return res.status(403).json({
        success: false,
        message: "Only freelancers can apply for jobs",
      });
    }
    //  find freelancer profile
    const freelancerProfile = await freelancerProfileModel.findOne({
      user: req.user._id,
    });
    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
      });
    }
    //  check if freelancer has already applied
    // const alreadyApplied = job.applicant.some(
    //   (app) => app.freelancer.toString() === freelancerProfile._id.toString()
    // );
    
    const alreadyApplied = job.applicants.some(
      (app) => app.freelancer.toString() === freelancerProfile._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    //  add applicant to job
    job.applicants.push({
      freelancer: freelancerProfile._id,
      coverLetter: req.body.coverLetter || "",
    });

    await job.save();

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//  GET all applications for a job
// const getJobApplicants = async (req, res) => {
//   try {
//     const job = await jobsModel.findById(req.params.id)
//     .populate({
//       path: "applicants.freelancer",  // populate freelancer details
//       populate: {
//         path: "user",  // populate the base user fields name , email etc
//         model: "User"
//       }
//     });
  
//   if (!job) {
//     return res.status(404).json({
//       success: false,
//       message: "Job not found",
//     });
//   }
  
//   //  ensure only client who posted the job can see applicants
//   if (job.client.toString() == req.user._id.toString()) {
//     return res.status(403).json({
//       success: false,
//       message: "You are not authorized to view applicants for this job"
//     });
//   }

//   res.status(200).json({
//     success: true,
//     applicants: job.applicants,
//   })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }

// GET /api/jobs/:id/applicants
const getJobApplicants = async (req, res) => {
  try {
    const job = await jobsModel.findById(req.params.id)
      .populate({
        path: "applicants.freelancer", // populate freelancer details
        populate: {
          path: "user", // populate the base user fields (name, email, etc.)
          model: "User"
        }
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Ensure only the client who posted the job can see the applicants
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view applicants for this job",
      });
    }

    res.status(200).json({
      success: true,
      applicants: job.applicants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export {
  jobPosted,
  jobListing,
  getJobById,
  updateJob,
  deleteJob,
  jobApplication,
  getJobApplicants
};
