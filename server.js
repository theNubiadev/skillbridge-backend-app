import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongoDB.js";
import userRouter from "./routes/userRoute.js"
import jobRouter from "./routes/jobsRoute.js";
import profileRouter from "./routes/profileRoute.js";

// APP config
const app = express();
const port = process.env.PORT;
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.use('/api/v1/user/', userRouter);
// app.use('/api/v1/client/jobs/', jobRouter);
app.use('/api/v1/jobs/', jobRouter);
app.use('/api/v1/profile/', profileRouter);

app.get('/', (req, res) => {
    res.json("API Initialized Successfully")
})
app.listen(port, () => console.log("Server Initialized on " + port));