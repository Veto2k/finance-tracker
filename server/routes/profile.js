const express = require("express");
const mongoose = require("mongoose");
const Tags = require("../models/Tags");
const User = require("../models/User");
const Transactions = require("../models/Transactions");
const Budgets = require("../models/Budgets");
const verifyToken = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const multer = require("multer");
require("dotenv").config();


// Configure multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

router.get("/user", verifyToken, async (req, res) => {
    try {
        const id = req.user.id;
        const user = await User.findById(id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile" });
    }
});

router.put("/change-password", verifyToken, async (req, res) => {
    try {
        const id = req.user.id;
        let { currentPassword, newPassword } = req.body;

        const user = await User.findOne({_id:id})

        if (!user) {
            console.log("User not found");
            return res.status(400).json({message : "User not found"});
        }
        
        // For Google users, skip current password validation
        if (user.type === 'google' ) {
            // First time setting password for Google user
            const salt = await bcrypt.genSalt(process.env.SALT);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            await User.findByIdAndUpdate(id, {password: hashedPassword});
            
            return res.status(200).json({message : "Password created successfully"});
        } else {
            // Regular password change flow with validation
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid current password" });
            }

            const salt = await bcrypt.genSalt(process.env.SALT);
            newPassword = await bcrypt.hash(newPassword, salt);
            
            await User.findByIdAndUpdate(id, {password: newPassword});
            
            return res.status(200).json({message : "Password updated successfully"});
        }
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({message : "Error updating password"});
    }
});

// Upload profile image
router.post("/upload-image", verifyToken, upload.single("profileImage"), async (req, res) => {
    try {
        const id = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        // Convert image buffer to base64
        const base64Image = req.file.buffer.toString('base64');
        
        // Construct the complete data URI for the image
        const imageType = req.file.mimetype;
        const imageData = `data:${imageType};base64,${base64Image}`;
        
        // Update user with the base64 image
        await User.findByIdAndUpdate(id, { profileImage: imageData });

        res.status(200).json({ 
            message: "Profile image uploaded successfully"
        });
    } catch (error) {
        console.error("Error uploading profile image:", error);
        res.status(500).json({ message: "Error uploading profile image" });
    }
});

// Update user profile
router.put("/user", verifyToken, async (req, res) => {
    try {
        const id = req.user.id;
        const { name } = req.body;
        
        await User.findByIdAndUpdate(id, { name });
        
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
});

router.delete("/user", verifyToken, async (req, res) => {
    try {
        const id = req.user.id;
        
        await User.findByIdAndDelete(id);   
        await Transactions.deleteMany({ user_id: id });
        await Budgets.deleteMany({ user_id: id });
        await Tags.deleteMany({ user_id: id });

        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: "Error deleting account" });
    }
}); 


module.exports = router;