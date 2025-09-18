import jwt from "jsonwebtoken"
import userModel from "../models/userModels.js"

const authMiddleware = async (req, res, next) => { 
    const { token } = req.headers;
    //  Bearer token

    //  if token is not provided 
    if (!token) {
        return res.status(401).json({
            success: false, 
            message: "No token provided"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await userModel.findById(decoded.id);
            //  
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            })
        }
        next();
    } catch (error) {
        console.log(error);
        
        return res.status(401).json({
            success: false, 
            message: "Invalid token"
        })
    }
}

export default authMiddleware;