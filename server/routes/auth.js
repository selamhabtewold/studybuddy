const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// User Signup
router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
});

// User Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        user.isActive = true;
        await user.save();

        res.json({ token, user: { id: user._id, username: user.username } });
    } catch (error) {
        res.status(500).json({ message: "Login error", error });
    }
});

// User Logout
router.post("/logout", async (req, res) => {
    const { userId } = req.body;
    try {
        await User.findByIdAndUpdate(userId, { isActive: false });
        res.json({ message: "User logged out" });
    } catch (error) {
        res.status(500).json({ message: "Logout error", error });
    }
});

// Get Active Users
router.get("/active-users", async (req, res) => {
    try {
        const activeUsers = await User.countDocuments({ isActive: true });
        res.json({ activeUsers });
    } catch (error) {
        res.status(500).json({ message: "Error getting active users", error });
    }
});

export default router;
