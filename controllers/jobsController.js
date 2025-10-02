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
      client: req.user.clientProfileId, // only owner/ author can delete
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
    const job = await jobsModel.findById(req.params.id).populate({
      path: "applicants.freelancer", // populate freelancer details
      select: "bio skills hourlyRate portfolio",
      populate: {
        path: "user", // populate the base user fields (name, email, etc.)
        model: "User",
        select: "name",
      },
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
    const { decision } = req.body; // "accept" or "reject"

    //  validate decision
    if (!["accepted", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must either be 'accepted' or 'rejected'",
      });
    }

    //  get the client profile for the logged-in user
    const clientProfile = await clientProfileModel.findOne({
      user: req.user._id,
    });
    if (!clientProfile) {
      return res.status(403).json({
        success: false,
        message: "You are not registered as a client",
      });
    }
    //  find job posted by the logged-in client
    const job = await jobsModel.findById({
      _id: jobId,
      client: clientProfile._id,
    });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or owned by you",
      });
    }
    //  find applicant inside the job
    const applicant = job.applicants.id(applicantId);
    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found",
      });
    }
    // isaiah 40:23
    applicant.status = decision; // updates status
    await job.save();

    res.status(200).json({
      success: true,
      message: `Application ${decision} successfully`,
      data: applicant,
    });
  } catch (error) {
    console.error("Error deciding application:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//  update job status
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log("JobId:", id);
    console.log("ClientId from token:", req.user._id);
    console.log("req.params:", req.params);
    console.log("Requested status:", status);

    if (!["open", "in-progress", "completed", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "invalid status",
      });
    }
    //  update the job status
    const job = await jobsModel.findOneAndUpdate(
      { _id: id, client: req.user.clientProfileId }, // ensure the job belongs to the logged-in client
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    //   adding a condition statement to fetch and display jobs by the client

    //  fetch all jobs for this client and sort by custom status order
    const jobs = await jobsModel.aggregate([
      { $match: { client: req.user.clientProfileId} },
      {
        $addFields: {
          sortOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "open"] }, then: 1 },
                { case: { $eq: ["$status", "in-progress"] }, then: 2 },
                { case: { $eq: ["$status", "completed"] }, then: 3 },
                { case: { $eq: ["$status", "closed"] }, then: 4 },
              ],
              default: 5,
            },
          },
        },
      },
      { $sort: { sortOrder: 1, createdAt: -1 } }, // sort by the custom status order first, then by creation date
      { $project: { sortOrder: 0 } }, // exclude sortOrder from final output
    ]);

    res.status(200).json({
      success: true,
      message: `Job status updated to ${status}`,
      updatedJob: job,
      allJobs: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAppliedJobs = async (req, res) => {
  try {
    //  ensures only freelancer can access
    if (req.user.role !== "freelancer") {
      return res.status(403).json({
        success: false,
        message: "Only freelancers can view applied jobs"
      });
    }

    //  find the freelancer profile
   const freelancerProfile = await freelancerProfileModel.findOne({
      user: req.user._id,
    });
    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found",
      });
    }
    //  find jobs where this freelancer has applied 
    const jobs = await jobsModel.find({
      "applicants.freelancer": freelancerProfile._id,
    }).select("title category status applicants hourlyRate");

    //  filter to show applicant application in such job
    const appliedJobs = jobs.map((job) => {
      const application = job.applicants.find(
        (a) => a.freelancer.toString() === freelancerProfile._id.toString()
      );

      return {
        _id: job._id,
        title: job.title,
        category: job.category,
        status: job.status,
        hourlyRate: job.hourlyRate,
        application: {
          coverLetter: application.coverLetter,
          appliedAt: application.appliedAt,
          status: application.ststus,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: appliedJobs
    });

  } catch (error) {
    console.error("Error fetching applied jobs", error);
    res.status(200).json({
      success: false,
      message: error.message
    })    
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
  updateJobStatus,
  getAppliedJobs,
};



// fortitude