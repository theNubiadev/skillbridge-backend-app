import express from "express"
import { jobPosted, jobListing, getJobById, updateJob , deleteJob, jobApplication, getJobApplicants} from "../controllers/jobsController.js"
import authMiddleware from "../middlewares/authMiddleware.js";


const jobRouter = express.Router();

// POST: Client creates a new job
jobRouter.post('/post', authMiddleware, jobPosted);

// PUT: Client updates a job opening
jobRouter.put('/edit/:id', authMiddleware, updateJob);

// GET: Anyone can fetch all jobs
jobRouter.get('/', jobListing);

// GET: Fetch a single job by ID
jobRouter.get('/:id', authMiddleware, getJobById);

// DELETE: Remove job
jobRouter.delete("/delete/:id", authMiddleware, deleteJob);

// PUT: Apply for jobs
jobRouter.put('/:id/apply', authMiddleware, jobApplication);

// GET: all job applicants
jobRouter.get("/:id/applicants", authMiddleware, getJobApplicants)
export default jobRouter;
