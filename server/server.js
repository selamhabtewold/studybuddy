// server.js (updated)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.mjs";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import studyGroupRoutes from "./routes/studyGroupRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import User from "./models/userModel.js";
import StudyGroup from "./models/studyGroup.js"; // Ensure this path is correct
import mongoose from "mongoose"; // Ensure mongoose is imported

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing in your .env file");
  process.exit(1);
}

try {
  connectDB();
} catch (error) {
  console.error("❌ Database connection failed:", error);
  process.exit(1);
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    transports: ["websocket", "polling"], // Explicitly allow WebSocket and polling
  },
});

let onlineUsers = new Map(); // userId -> socket.id

// Define a simple Message model for chat history (optional, for persistence)
const Message = mongoose.model("Message", {
  groupId: String,
  userId: String,
  userName: String,
  message: String,
  audioUrl: String,
  fileUrl: String,
  timestamp: Date,
  messageId: String, // Ensure messageId is part of the model for uniqueness
});

io.on("connection", (socket) => {
  console.log(`🔵 New client connected: ${socket.id}`);

  socket.on("userLoggedIn", (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`✅ User logged in: ${userId}`);
      updateOnlineUsers();
    } else {
      console.warn("Invalid userId in userLoggedIn event");
    }
  });

  socket.on("joinGroup", async ({ userId, groupId }) => {
    console.log(`User ${userId} attempting to join group ${groupId}`);
    try {
      const group = await StudyGroup.findById(groupId);
      if (!group) throw new Error("Group not found");

      // Ensure members is an array, default to empty if undefined
      if (!Array.isArray(group.members)) {
        group.members = [];
      }

      // Check if user is already a member (prevent duplicate joining)
      if (group.members.includes(userId)) {
        socket.emit("error", { message: "You are already a member of this group" });
        return;
      }

      // Validate MongoDB ObjectId using mongoose
      if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
        socket.emit("error", { message: "Invalid group ID or user ID" });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        socket.emit("error", { message: "User not found" });
        return;
      }

      // Add user to members array and update count
      group.members.push(userId);
      group.membersCount = group.members.length; // Update count to match array length
      await group.save();

      // Update user's joinedGroups
      user.joinedGroups.push(groupId);
      await user.save();

      // Emit updated group to all clients
      const updatedGroup = {
        _id: group._id,
        members: group.members, // Send the members array
        membersCount: group.membersCount, // Send the count
        name: group.name, // Ensure name is included
      };
      io.emit("groupUpdated", updatedGroup);

      console.log(`User ${userId} successfully joined group ${groupId}`);
    } catch (error) {
      console.error("Error joining group:", error);
      socket.emit("error", { message: error.message });
    }
    updateOnlineUsers();
  });

  socket.on("notifyClassroom", ({ classroomId, users }) => {
    console.log(`Notifying users for classroom ${classroomId}:`, users);
    users.forEach((userId) => {
      const socketId = onlineUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit("classroomInvite", { 
          classroomId, 
          creator: userId, // Add creator for context
          message: "You’ve been invited to join a classroom. Join or decline?"
        });
        console.log(`Sent invite to ${userId} for classroom ${classroomId}`);
        updateClassroomInvitedUsers(classroomId, userId);
      } else {
        console.warn(`User ${userId} not online for classroom notification`);
      }
    });
  });

  socket.on("classroomResponse", ({ classroomId, userId, response }) => {
    console.log(`User ${userId} responded to classroom ${classroomId}: ${response}`);
    updateClassroomResponse(classroomId, userId, response);
  });

  socket.on("joinGroupChat", ({ userId, groupId }) => {
    // Join the group chat room
    socket.join(`group_${groupId}`);
    console.log(`User ${userId} joined group chat room for group ${groupId}`);
    // Emit updated member count to all users in the room
    broadcastMemberCount(groupId);
  });

  socket.on("sendGroupMessage", async ({ userId, groupId, message, userName, audioUrl, fileUrl, messageId }) => {
    console.log(`Message from ${userId} (${userName}) in group ${groupId}:`, { message, audioUrl, fileUrl, messageId });
    // Fetch the sender's name if not provided (optional, for robustness)
    let senderName = userName;
    if (!senderName) {
      const user = await User.findById(userId).select("name");
      senderName = user?.name || "Anonymous";
    }

    // Broadcast message to all users in the group chat room
    const messageData = {
      userId,
      groupId,
      message,
      userName: senderName, // Include the sender's name
      timestamp: new Date().toISOString(),
      messageId, // Ensure messageId is included for uniqueness
    };

    if (message) messageData.message = message;
    if (audioUrl) messageData.audioUrl = audioUrl;
    if (fileUrl) messageData.fileUrl = fileUrl;

    // Save message to database for persistence
    await Message.create(messageData);

    // Broadcast to all users in the group (including the sender for consistency)
    console.log(`Broadcasting message to group ${groupId}:`, messageData);
    io.to(`group_${groupId}`).emit("receiveGroupMessage", messageData);
  });

  socket.on("typing", ({ userId, groupId }) => {
    // Broadcast typing indicator to all users in the group
    console.log(`Broadcasting typing for user ${userId} in group ${groupId}`);
    io.to(`group_${groupId}`).emit("typing", { userId, groupId });
  });

  socket.on("leaveGroup", async ({ userId, groupId }) => {
    console.log(`User ${userId} attempting to leave group ${groupId}`);
    try {
      const group = await StudyGroup.findById(groupId);
      if (!group) throw new Error("Group not found");

      // Ensure members is an array
      if (!Array.isArray(group.members)) {
        group.members = [];
      }

      // Check if user is a member
      if (!group.members.includes(userId)) {
        socket.emit("error", { message: "You are not a member of this group" });
        return;
      }

      // Remove user from members and decrement membersCount
      group.members = group.members.filter(id => id.toString() !== userId);
      group.membersCount = Math.max(0, group.members.length); // Ensure non-negative
      await group.save();

      // Update user to remove group from joinedGroups
      const user = await User.findById(userId);
      if (user) {
        user.joinedGroups = user.joinedGroups.filter(id => id.toString() !== groupId);
        await user.save();
      }

      // Emit updated group to all clients
      const updatedGroup = {
        _id: group._id,
        members: group.members,
        membersCount: group.membersCount,
        name: group.name, // Ensure name is included
      };
      io.emit("groupUpdated", updatedGroup);

      console.log(`User ${userId} successfully left group ${groupId}`);
    } catch (error) {
      console.error("Error leaving group:", error);
      socket.emit("error", { message: error.message });
    }
    updateOnlineUsers();
  });

  socket.on("disconnect", () => {
    let disconnectedUserId = null;
    for (let [userId, id] of onlineUsers) {
      if (id === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        console.log(`❌ User disconnected: ${userId}`);
        break;
      }
    }
    console.log(`❌ Client disconnected: ${socket.id}`);
    if (disconnectedUserId) {
      updateOnlineUsers();
    }
  });

  // New Socket.IO listeners for classroom events
  socket.on("classroomEnded", (data) => {
    console.log(`Classroom ${data.classroomId} ended`);
    // No action needed here; handled by backend route
  });

  socket.on("classroomDeleted", (data) => {
    console.log(`Classroom ${data.classroomId} deleted`);
    // Notify clients to clear invitations
    io.emit("clearInvitation", { classroomId: data.classroomId });
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${reason}`);
  });
});

// New function to broadcast member count to group chat room
async function broadcastMemberCount(groupId) {
  try {
    const group = await StudyGroup.findById(groupId).select("membersCount");
    if (group) {
      console.log(`Broadcasting member count for group ${groupId}:`, group.membersCount);
      io.to(`group_${groupId}`).emit("memberCountUpdated", {
        groupId,
        membersCount: group.membersCount,
      });
    }
  } catch (error) {
    console.error("Error broadcasting member count:", error);
  }
}

function updateOnlineUsers() {
  const groups = {};
  const onlineUserIds = Array.from(onlineUsers.keys());

  if (onlineUserIds.length === 0) {
    io.emit("onlineUsers", groups);
    io.emit("activeUserCount", 0);
    return;
  }

  User.find({ _id: { $in: onlineUserIds } })
    .select("name _id")
    .then((users) => {
      const userMap = {};
      users.forEach((user) => {
        userMap[user._id.toString()] = user.name;
      });

      User.find({ _id: { $in: onlineUserIds } })
        .populate("joinedGroups", "name _id")
        .then((users) => {
          users.forEach((user) => {
            user.joinedGroups.forEach((group) => {
              if (!groups[group._id]) groups[group._id] = [];
              const userName = userMap[user._id.toString()];
              if (userName) {
                groups[group._id].push({ userId: user._id.toString(), name: userName });
              }
            });
          });
          console.log("Emitting online users with names:", groups);
          io.emit("onlineUsers", groups);

          const totalActiveUsers = onlineUserIds.length;
          console.log("Emitting active user count:", totalActiveUsers);
          io.emit("activeUserCount", totalActiveUsers);
        })
        .catch((error) => {
          console.error("Error fetching users' groups for online status:", error);
        });
    })
    .catch((error) => {
      console.error("Error fetching online users' names:", error);
    });
}

async function updateClassroomInvitedUsers(classroomId, userId) {
  try {
    const Classroom = mongoose.model("Classroom");
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      console.error("Classroom not found:", classroomId);
      return;
    }
    if (!classroom.invitedUsers.includes(userId)) {
      classroom.invitedUsers.push(userId);
      await classroom.save();
    }
  } catch (error) {
    console.error("Error updating invited users:", error);
  }
}

async function updateClassroomResponse(classroomId, userId, response) {
  try {
    const Classroom = mongoose.model("Classroom");
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      console.error("Classroom not found:", classroomId);
      return;
    }

    if (response === "accept") {
      if (!classroom.allowedUsers.includes(userId)) {
        classroom.allowedUsers.push(userId);
      }
    } else if (response === "decline") {
      console.log(`User ${userId} declined classroom ${classroomId}`);
    }

    await classroom.save();
    io.emit("classroomUpdated", { classroomId, allowedUsers: classroom.allowedUsers });
  } catch (error) {
    console.error("Error updating classroom response:", error);
  }
}

// Middleware
app.use(cors({ 
  origin: process.env.CLIENT_URL || "http://localhost:5173", 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Include OPTIONS for preflight
  allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
}));
app.use(express.json());

// Store io in app for use in routes
app.set("io", io);

// Routes
app.use("/api", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/study-groups", studyGroupRoutes);
app.use("/api/classrooms", classroomRoutes);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});