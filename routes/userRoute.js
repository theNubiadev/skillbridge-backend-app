import express from "express"
import {  loginUser, registerUser, } from "../controllers/userController.js"


const userRouter = express.Router();
// POST USER AUTHENTAICATION
userRouter.post("/register",  registerUser);
userRouter.post("/login", loginUser);


export default userRouter;
