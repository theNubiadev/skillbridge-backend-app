import  jwt  from "jsonwebtoken";
import bcrypt from "bcryptjs";
import userModel from "../models/userModels.js";
import validator from "validator";
import freelancerProfileModel from "../models/freelancerProfileModel.js";
import cllientProfileModel from "../models/clientProfileModel.js";

//  token creation 
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
// POST  User Register
const registerUser = async (req, res) => {
        // res.json({ success: true, msg: 'Register  API endpoint working'});
        try {
            const { name, email, password, role } = req.body;
            //  checks if user exists or not
            const exists = await userModel.findOne({ email });
            if (exists) {
                return res.json({ success: false, message: "User already exists"})
            }
            //  validate user email 
            if (!validator.isEmail(email)) {
                return res.json({
                    success: false,
                    message: "Please enter a valid email"
                });
            }
            //  
            if (!name) {
                return res.json({
                    success: false,
                    message: "Name field is empty"
                })
            }
            //  checking the password length
            if (password.length < 8) {
               return  res.json({
                    success: false,
                    message: "Please enter a strong password"
                });
            }
            //  hashing user password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt)

            const newUser = new userModel({
                name,
                email,
                password: hashedPassword,
                role,
            });
                //  save user to db
            const user = await newUser.save();
            const token = createToken(user._id);
            res.json({ success: true, token,  message: "User Registered Successfully"})

        }
        catch (error) {
            console.log(error);
            res.json({ success: false,  message: error.message
            });
        }
}

// POST  User Login
const loginUser = async (req, res) => {
    // res.json({ success: true,  msg: 'Login Api Endpoint ' });
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        //  checks for user account while logging
        if (!user) {
            return res.json({ success: false, message: "Account not found! Create an account" });
        }
        //  checks if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = createToken(user._id);
            res.json({ success: true, token, message: "Login successfully" });
        } else {
            return res.json({ success: false, message: "Invalid details"})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Invalid Details" });
    }
}

export {
    loginUser,
    registerUser
};