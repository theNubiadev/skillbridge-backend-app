import jwt from "jsonwebtoken";
import userModel from "../models/userModels.js";
import clientModel from "../models/clientProfileModel.js";

const authMiddleware = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ fetch user
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // attach to req
    req.user = user;

    // ✅ If role is client, fetch client profile and attach its _id
    if (user.role === "client") {
      const clientProfile = await clientModel.findOne({ user: user._id });
      if (clientProfile) {
        req.user.clientProfileId = clientProfile._id;
      }
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default authMiddleware;
