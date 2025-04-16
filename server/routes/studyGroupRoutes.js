import express from "express";
import StudyGroup from "../models/studyGroup.js"; // Ensure this path is correct
import User from "../models/userModel.js";
import authenticateUser from "../middleware/authMiddleware.js"; // Import middleware
import mongoose from "mongoose";
import multer from "multer"; // For handling file uploads
import path from "path"; // For file path manipulation
import { fileURLToPath } from "url"; // To handle __dirname in ES modules

const router = express.Router();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/")); // Save files in an 'uploads' folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Middleware to serve uploaded files statically (add this in your main server file if not already present)
// router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Get a specific study group by ID (for member count and details)
router.get("/:groupId", async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId).select("name members membersCount image description");
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: "Error fetching group" });
  }
});

// Get all study groups
router.get("/", async (req, res) => {
  try {
    const groups = await StudyGroup.find().select("name membersCount image description");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Error fetching groups" });
  }
});

// Get study groups by subject (recommendation)
router.get("/subject/:subject", async (req, res) => {
  try {
    const groups = await StudyGroup.find({ subject: req.params.subject });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Error fetching study groups" });
  }
});

// Create a new study group
router.post("/", async (req, res) => {
  try {
    const newGroup = new StudyGroup(req.body);
    await newGroup.save();
    res.status(201).json({ message: "Study group created successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error creating study group" });
  }
});

// Add multiple study groups
router.post("/add-multiple", async (req, res) => {
  try {
    const studyGroups = req.body;
    if (!Array.isArray(studyGroups) || studyGroups.length === 0) {
      return res.status(400).json({ message: "Invalid data format. Provide an array of study groups." });
    }
    const newGroups = await StudyGroup.insertMany(studyGroups);
    res.status(201).json({ message: "Study groups added successfully!", data: newGroups });
  } catch (error) {
    console.error("Error adding study groups:", error);
    res.status(500).json({ message: "Server error. Could not add study groups." });
  }
});

// Get Top 6 Study Groups
router.get("/top6", async (req, res) => {
  try {
    const studyGroups = await StudyGroup.find().limit(6);
    res.json(studyGroups);
  } catch (error) {
    console.error("Error fetching study groups:", error);
    res.status(500).json({ message: "Server error. Could not fetch study groups." });
  }
});

// Join a study group
router.post("/join/:groupId", async (req, res) => {
  try {
    const { userId } = req.body;
    const groupId = req.params.groupId;

    if (!userId || !groupId) {
      return res.status(400).json({ message: "User ID and group ID are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid group ID or user ID" });
    }

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }

    group.members.push(userId);
    group.membersCount = (group.membersCount || 0) + 1;
    await group.save();

    user.joinedGroups.push(groupId);
    await user.save();

    const updatedGroup = {
      _id: group._id,
      members: group.members,
      membersCount: group.membersCount,
      name: group.name,
    };

    if (req.app.get("io")) {
      req.app.get("io").emit("groupUpdated", updatedGroup);
    }

    res.status(200).json({ message: "Successfully joined the group", group: updatedGroup });
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// Leave a study group
router.post("/leave/:groupId", authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.body.userId || req.user._id;

    if (!userId || !groupId) {
      return res.status(400).json({ message: "User ID and group ID are required" });
    }

    const group = await StudyGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    group.members = group.members.filter((id) => id.toString() !== userId.toString());
    group.membersCount = group.members.length;
    await group.save();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.joinedGroups = user.joinedGroups.filter((id) => id.toString() !== groupId.toString());
    await user.save();

    res.status(200).json({
      message: "Left the group successfully",
      group: { _id: group._id, members: group.members, membersCount: group.membersCount },
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// New endpoint for file upload
router.post('/send-file', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    const { userId, groupId, userName } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const group = await StudyGroup.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ fileUrl, fileName: req.file.originalname });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Optional: Add audio upload endpoint for completeness
router.post("/send-audio", authenticateUser, upload.single("audio"), async (req, res) => {
  try {
    const { userId, groupId, userName } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No audio uploaded" });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid group ID or user ID" });
    }

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: "User is not a member of this group" });
    }

    const audioUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ audioUrl });
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ message: "Server error while uploading audio" });
  }
});

export default router;