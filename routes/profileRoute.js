import express from "express";
import {
  updateFreelancerProfile,
  updateClientProfile,
  viewClientProfile,
  viewFreeelancerProfile
} from "../controllers/profileUpdateController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const profileRouter = express.Router();

profileRouter.put("/freelancer/update", authMiddleware, updateFreelancerProfile);
profileRouter.put("/client/update", authMiddleware, updateClientProfile);
profileRouter.get('/client/',  viewClientProfile);
profileRouter.get('/freelancer/',  viewFreeelancerProfile);


export default profileRouter;
