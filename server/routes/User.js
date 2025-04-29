const express = require("express")
const mongoose = require('mongoose');
const User = require("../models/User")
const Tags = require("../models/Tags")
const Transactions = require("../models/Transactions")
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken")
require("dotenv").config()
const verifyToken = require("../middleware/auth");

const router = express.Router()
const client = new OAuth2Client(process.env.GOOGLE_AUTH);

const generateToken = (userId) => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET , {expiresIn: "1h"})
}

router.get("/validate-token", verifyToken, (req, res) => {
    res.json({ valid: true, user: req.user });
  });

router.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const type = "password"
      console.log(req.body)
  
      // Validation: Ensure fields exist
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      const newUser = new User({ name, type,email, password });
      await newUser.save();
      res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try{
        const user = await User.findOne({email:email})
        const user_id = user._id

        await User.findByIdAndUpdate(user_id, {type:"password"})

        if (!user) {
            console.log("User not found");
            return res.status(400).json({message : "User not found"});
          }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = generateToken(user_id)
        return res.status(200).json({ token, user: { id: user_id, email: user.email } });

    }
    catch(err)
    {
        res.status(500).json({ message: "Server error" });
    }
  })

  router.post("/auth/google", async (req, res) => {
    try {
      const { token } = req.body;
  
      // Verify Google Token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "1094210636831-r4nf7522f0osickv6qs67geh71nhedm6.apps.googleusercontent.com",
      });
  
      const { email, name, sub } = ticket.getPayload();

      console.log(email, name, sub)

      const type = "google"
  
      // Check if user exists in database
      let user = await User.findOne({ email: email });
  
      if (!user) {
        user = new User({ name, type, email });
        await user.save();
      }

      let user_id = await User.find({email:email})

      user_id = user_id[0]._id
      
      await User.findByIdAndUpdate(user_id, {type:"google"})
  
      // Generate JWT for frontend
      const jwtToken = generateToken(user_id)
      
      return res.status(200).json({ jwtToken, user: { id: user_id._id, email: user.email } });

    } catch (err) {
      res.status(400).json({ message: "Google authentication failed" });
    }
  });

module.exports = router;