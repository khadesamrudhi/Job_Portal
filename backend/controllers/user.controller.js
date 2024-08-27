
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;

        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: "user already exist",
                success: false,
            });
        };

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role
        });
        return res.status(201).json({
            message: "Account Created succesfully",
            success: true,
        });
    } catch (error) {
        console.log(error)
    }
}

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password",
                success: false
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password",
                success: false
            })
        };
        if (role != user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role",
                success: false
            })
        }

        const tokenData = {
            userId: user._id
        };
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });
        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile

        }

        return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        });
    } catch (error) {
        console.log(error)
    }
}

export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully',
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;

        const file = req.file;



        let fileUri;
        let cloudResponse;

        if (file) {
            // Ensure file object is valid
            if (!file.originalname || !file.buffer) {
                return res.status(400).json({
                    message: "Invalid file object",
                    success: false
                });
            }

            // Cloudinary upload
            fileUri = getDataUri(file);
            cloudResponse = await cloudinary.uploader.upload(fileUri.content);
        }

        let skillsArray;
        if (skills) {
            skillsArray = skills.split(",");
        }

        const userId = req.id;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                message: "User not found",
                success: false
            });
        }

        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (bio) user.profile.bio = bio;
        if (skills) user.profile.skills = skillsArray;

        // Resume handling
        if (cloudResponse) {
            console.log('Cloudinary URL:', cloudResponse.secure_url);
            user.profile.resume = cloudResponse.secure_url;
            user.profile.resumeOriginalName = file.originalname; // Corrected typo
        }

        await user.save();

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        return res.status(200).json({
            message: "Profile updated successfully",
            user,
            success: true
        });

    } catch (error) {
        console.error('Error:', error); // Improved logging
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};
