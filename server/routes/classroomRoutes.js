// routes/classroomRoutes.js
import express from "express";
import Classroom from "../models/classroom.js";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateUser, async (req, res) => {
  try {
    const scheduledStartTime = new Date(req.body.scheduledStartTime);
    if (isNaN(scheduledStartTime.getTime())) {
      return res.status(400).json({ message: "Invalid scheduled start time" });
    }

    const classroom = new Classroom({
      name: req.body.name,
      creator: req.user.userId,
      allowedUsers: [req.user.userId], // Automatically include creator
      invitedUsers: req.body.isPublic ? [] : req.body.selectedUsers || [], // Only track other invited users
      isPublic: req.body.isPublic,
      duration: req.body.duration || 60, // Default to 60 minutes
      scheduledStartTime, // Set scheduled start time
    });
    await classroom.save();
    res.json({ message: "Classroom created", classroomId: classroom._id });
  } catch (error) {
    res.status(500).json({ message: "Error creating classroom", error: error.message });
  }
});

router.put("/:classroomId/duration", authenticateUser, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    if (classroom.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the creator can modify duration" });
    }
    classroom.duration = req.body.duration || classroom.duration;
    await classroom.save();
    res.json({ message: "Classroom duration updated", classroom });
  } catch (error) {
    res.status(500).json({ message: "Error updating duration", error: error.message });
  }
});

router.put("/:classroomId/start", authenticateUser, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    if (classroom.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the creator can start the session" });
    }
    if (new Date() < classroom.scheduledStartTime) {
      return res.status(400).json({ message: "Cannot start session before scheduled time" });
    }
    classroom.startTime = new Date();
    classroom.isActive = true;
    await classroom.save();
    io.emit("classroomStarted", { classroomId: classroom._id }); // Notify all clients
    res.json({ message: "Classroom session started", classroom });
  } catch (error) {
    res.status(500).json({ message: "Error starting session", error: error.message });
  }
});

router.put("/:classroomId/end", authenticateUser, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    if (classroom.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the creator can end the session" });
    }
    if (!classroom.startTime) {
      return res.status(400).json({ message: "Session has not started yet" });
    }
    classroom.endTime = new Date();
    classroom.allowedUsers = []; // Remove all users, including creator
    classroom.isActive = false;
    await classroom.save();
    io.emit("classroomEnded", { classroomId: classroom._id }); // Notify all clients
    res.json({ message: "Classroom session ended", classroom });
  } catch (error) {
    res.status(500).json({ message: "Error ending session", error: error.message });
  }
});

router.delete("/:classroomId", authenticateUser, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    if (classroom.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the creator can delete the session" });
    }
    await Classroom.deleteOne({ _id: req.params.classroomId });
    io.emit("classroomDeleted", { classroomId: classroom._id }); // Notify all clients to clear invitations
    res.json({ message: "Classroom deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting classroom", error: error.message });
  }
});

router.get("/:classroomId", authenticateUser, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId)
      .populate("creator", "name")
      .populate("invitedUsers", "name")
      .populate("allowedUsers", "name");
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: "Error fetching classroom", error: error.message });
  }
});

// New endpoint to fetch classrooms created by a user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const classrooms = await Classroom.find({ creator: req.user.userId })
      .populate("creator", "name")
      .populate("invitedUsers", "name")
      .populate("allowedUsers", "name")
      .sort({ scheduledStartTime: -1 }); // Sort by scheduled start time, newest first
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching created classrooms", error: error.message });
  }
});

export default router;