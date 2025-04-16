import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import authenticateUser from "../middleware/authMiddleware.js";
import authenticateToken from "../middleware/authToken.js";

dotenv.config();
const router = express.Router();
let activeUsers = new Set();

// **User Registration**
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role: role || "user" });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email }).select('+password +role'); // Include password and role
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login successful",
      userId: user._id,
      email: user.email,
      role: user.role, // Add role to the response
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// **Active Users Count**
router.get("/users/active-users", (req, res) => {
  res.json({ activeUsers: activeUsers.size });
});

// **Protected Route - Save Preferences**
router.post("/users/preferences", authenticateUser, async (req, res) => {
  const { interests, subjects } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.interests = interests;
    user.subjects = subjects;
    await user.save();

    res.json({ message: "Preferences saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error saving preferences" });
  }
});

// userRoutes.js
// userRoutes.js
router.get("/users/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("joinedGroups", "name members"); // Include members field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Error fetching user details", error });
  }
});
// userRoutes.js
router.put("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    await user.save();
    res.json({ message: "User updated", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
});


// userRoutes.js
router.get("/users/verify", authenticateToken, (req, res) => {
  try {
    res.status(200).json({
      role: req.user.role, // Assuming req.user is set by authenticateToken middleware
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Middleware to authenticate token



export default router;
