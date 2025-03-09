import express from "express";
import StudyGroup from "../models/studyGroup.js"; // Ensure this path is correct
import User from "../models/userModel.js";
import authenticateUser from "../middleware/authMiddleware.js"; // Import middleware
import mongoose from "mongoose"; // Ensure mongoose is imported correctly

const router = express.Router();

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

// Join a study group
// router.post("/join/:groupId", async (req, res) => {
//   const { userId } = req.body;
//   const { groupId } = req.params;

//   try {
//     const group = await StudyGroup.findById(groupId);
//     if (!group) return res.status(404).json({ message: "Group not found" });

//     // Ensure members is an array, default to empty if undefined
//     if (!Array.isArray(group.members)) {
//       group.members = [];
//     }

//     // Check if user is already a member (to prevent duplicates)
//     if (group.members.includes(userId)) {
//       return res.status(400).json({ message: "You are already a member of this group" });
//     }

//     // Validate MongoDB ObjectId using mongoose
//     if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid group ID or user ID" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Add user to members array and update count
//     group.members.push(userId);
//     group.membersCount = group.members.length; // Update count to match array length
//     await group.save();

//     res.status(200).json({ group: { _id: groupId, members: group.members, membersCount: group.membersCount } });
//   } catch (error) {
//     console.error("Error joining study group:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

router.get("/", async (req, res) => {
  try {
    const groups = await StudyGroup.find().select("name membersCount image description");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Error fetching groups" });
  }
});

// Get all study groups with populated members
router.get("/", async (req, res) => {
  try {
    const groups = await StudyGroup.find().populate("members", "name email");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Error fetching study groups" });
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

router.post("/add-multiple", async (req, res) => {
  try {
    const studyGroups = req.body; // Expecting an array of study groups
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
    const studyGroups = await StudyGroup.find().limit(6); // Get top 6 groups
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
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

    // Validate inputs
    if (!userId || !groupId) {
      return res.status(400).json({ message: "User ID and group ID are required" });
    }

    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid group ID or user ID" });
    }

    // Find the group
    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }

    // Update the group: add user to members and increment membersCount
    group.members.push(userId);
    group.membersCount = (group.membersCount || 0) + 1; // Increment membersCount
    await group.save();

    // Update the user: add group to joinedGroups
    user.joinedGroups.push(groupId); // Store the groupId in user's joinedGroups
    await user.save();

    // Prepare response data
    const updatedGroup = {
      _id: group._id,
      members: group.members,
      membersCount: group.membersCount,
      name: group.name, // Ensure name is included in the response
    };

    // Emit Socket.IO event (if using Socket.IO in your routes)
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
// In studyGroupRoutes.js
router.post("/leave/:groupId", authenticateUser, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.body.userId || req.user._id; // Use userId from body or auth middleware

    // Validate userId and groupId
    if (!userId || !groupId) {
      return res.status(400).json({ message: "User ID and group ID are required" });
    }

    // Find the group
    const group = await StudyGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    // Update the group: remove user from members and decrement membersCount
    group.members = group.members.filter(id => id.toString() !== userId.toString());
    group.membersCount = group.members.length; // Update count to match array length
    await group.save();

    // Update the user: remove group from joinedGroups
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.joinedGroups = user.joinedGroups.filter(id => id.toString() !== groupId.toString());
    await user.save();

    // Return the updated group data
    res.status(200).json({ 
      message: "Left the group successfully", 
      group: { _id: group._id, members: group.members, membersCount: group.membersCount } 
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

export default router;