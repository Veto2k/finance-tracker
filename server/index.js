const express = require('express')
const mongoose = require('mongoose')
const User = require("./routes/User")
const cors = require("cors")
const Budget = require("./routes/Budgets")
const Transaction = require("./routes/transactions")
const Tags = require("./routes/tags")
const Dashboard = require("./routes/dashboard")
const Reports = require("./routes/reports")
const Profile = require("./routes/profile")
const app = express()
require("dotenv").config();

app.use(cors())

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/reports', Reports)
app.use('/dashboard', Dashboard)
app.use('/budgets', Budget)
app.use('/transactions', Transaction)
app.use('/tags', Tags)
app.use('/profile', Profile)
app.use('/', User)


const connectToDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Database connection error:", error);
      process.exit(1); // Exit the process on failure
    }
  };

  connectToDB()

app.listen(3000, console.log("server is running"))