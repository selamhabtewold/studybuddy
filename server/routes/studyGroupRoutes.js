import  express from "express";
import StudyGroup from "../models/studyGroup.js";
import  User from "../models/userModel.js";



import authenticateUser from "../middleware/authMiddleware.js"; // Import middleware


const router = express.Router();

router.post("/join/:groupId", authenticateUser, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.includes(req.userId)) {
      group.members.push(req.userId);
      await group.save();
    }

    res.json({ message: "Joined successfully", user: req.userId });
  } catch (error) {
    res.status(500).json({ message: "Error joining study group" });
  }
});


// Join a study group
// router.post("/join/:groupId", async (req, res) => {
//   try {
//     const { groupId } = req.params;
//     const { userId } = req.body;

//     // Validate MongoDB ObjectId
//     if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid group ID or user ID" });
//     }

//     const group = await StudyGroup.findById(groupId);
//     const user = await User.findById(userId);

//     if (!group) {
//       return res.status(404).json({ message: "Study group not found" });
//     }
    
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if user already joined
//     if (group.members.includes(userId)) {
//       return res.status(400).json({ message: "User already in the group" });
//     }

//     // Add user to the group
//     group.members.push(userId);
//     await group.save();

//     // Send the updated group data
//     res.json(group);
//   } catch (error) {
//     console.error("Error joining study group:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });



// ✅ Get all study groups
router.get("/", async (req, res) => {
  try {
    const groups = await StudyGroup.find().populate("members", "name email");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Error fetching study groups" });
  }
});

// ✅ Get study groups by subject (recommendation)
router.get("/subject/:subject", async (req, res) => {
  try {
    const groups = await StudyGroup.find({ subject: req.params.subject });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Error fetching study groups" });
  }
});

// ✅ Create a new study group
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
// ✅ Join a study group
// router.post("/join/:groupId/:userId", async (req, res) => {
//   try {
//     const group = await StudyGroup.findById(req.params.groupId);
//     const user = await User.findById(req.params.userId);

//     if (!group || !user) {
//       return res.status(404).json({ message: "Group or user not found" });
//     }

//     if (!group.members.includes(user._id)) {
//       group.members.push(user._id);
//       await group.save();
//     }

//     res.json({ message: "Joined the study group successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error joining study group" });
//   }
// });

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

// ✅ Leave a study group
router.post("/leave/:groupId/:userId", async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.members = group.members.filter((id) => id.toString() !== req.params.userId);
    await group.save();

    res.json({ message: "Left the study group successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error leaving study group" });
  }
});

export default router;