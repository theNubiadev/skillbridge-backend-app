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
    //  isaiah 40:29
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



// GET /api/jobs/:id/applicants
const getJobApplicants = async (req, res) => {
  try {
    const job = await jobsModel.findById(req.params.id)
      .populate({
        path: "applicants.freelancer", // populate freelancer details
        select: "bio skills hourlyRate portfolio",
        populate: {
          path: "user", // populate the base user fields (name, email, etc.)
          model: "User",
          select: "name"
        }
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    // Ensure only the client who posted the job can see the applicants
    if (job.client.toString() == req.user._id.toString()) {
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

const decideApplication = async (req, res) => {
    try {
      const { jobId, applicantId } = req.params;
      const { decision } = req.body;   // "accept" or "reject"

      //  validate decision
      if (!["accepted", "rejected"].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: "Decision must either be 'accepted' or 'rejected'"
        })
      }
      //  find job posted by the logged-in client
      // const job = await jobsModel.findOne({
      //   _id: jobId,
      //   client: req.user._id,
      // });
      // if (!job) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Job not found"
      //   });
      // }
      const job = await jobsModel.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found"
        });
      }
      //  find applicant inside the job
      const applicant = job.applicants.id(applicantId);
      if (!applicant) {
        return res.status(404).json({
          success: false, 
          message: "Applicant not found"
        })
      }
      applicant.status = decision; // updates status
      await job.save();

      res.status(200).json({
        success: true,
        message: `Application ${decision} successfully`,
        data: applicant
      })
    } catch (error) {
      console.error("Error deciding application:", error)
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }
}
//  update job status
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["open", "in-progress", "completed", "closed"].includes(status) ) {
      return res.status(400).json({
        success: false,
        message: "invalid status"
      });
    }
    const job = await jobsModel.findOneAndUpdate(
      { _id: id, client: req.user._id },
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
       })
    };
    res.status(200).json({
      success: true,
      message: `Job ststus updated to ${status}`,
      data:job
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}



export {
  jobPosted,
  jobListing,
  getJobById,
  updateJob,
  deleteJob,
  jobApplication,
  getJobApplicants,
  decideApplication,
  updateJobStatus
};
