import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose"; // ✅ Ensure ObjectId validation
import User from "../models/userModel.js";
import authenticateUser from "../middleware/authMiddleware.js"; // Middleware for token verification

dotenv.config();
const router = express.Router();

// **User Registration Route**
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // **Hash the password before saving**
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, // Store hashed password
      role: role || "user" 
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully!", role: newUser.role });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// **User Login Route**
router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // **Generate JWT Token (Ensure `userId` is included)**
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ 
      message: "Login successful", 
      email: user.email, 
      role: user.role, 
      token 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// **Save User Preferences (Protected Route)**
router.post("/users/preferences", authenticateUser, async (req, res) => {
  const { interests, subjects } = req.body;
  console.log("Token being sent:", token);

  try {
    // ✅ Validate ObjectId before querying database
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.interests = interests;
    user.subjects = subjects;
    await user.save();

    res.json({ message: "Preferences saved successfully!", user });
  } catch (error) {
    res.status(500).json({ message: "Error saving preferences", error });
  }
});

// **Tracking Route**
router.post("/track-navigation", authenticateUser, async (req, res) => {
  try {
    const { userId, page } = req.body;

    console.log(`Tracking User ID: ${userId}, Page: ${page}`);

    res.status(200).json({ message: "Navigation tracked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error tracking navigation", error });
  }
});

router.options("/users/preferences", (req, res) => {
  res.header("Access-Control-Allow-Methods", "POST");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204); // ✅ No Content (success)
});


export default router;
