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
import StudyGroup from "./models/studyGroup.js";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authenticateUser from "./middleware/authMiddleware.js";


dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    transports: ["websocket", "polling"],
  },
  path: "/socket.io/",
});

let onlineUsers = new Map();


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

      if (!Array.isArray(group.members)) {
        group.members = [];
      }

      if (group.members.includes(userId)) {
        socket.emit("error", { message: "You are already a member of this group" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
        socket.emit("error", { message: "Invalid group ID or user ID" });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        socket.emit("error", { message: "User not found" });
        return;
      }

      group.members.push(userId);
      group.membersCount = group.members.length;
      await group.save();

      user.joinedGroups.push(groupId);
      await user.save();

      const updatedGroup = {
        _id: group._id,
        members: group.members,
        membersCount: group.membersCount,
        name: group.name,
      };
      io.emit("groupUpdated", updatedGroup);

      console.log(`User ${userId} successfully joined group ${groupId}`);
    } catch (error) {
      console.error("Error joining group:", error);
      socket.emit("error", { message: error.message });
    }
    updateOnlineUsers();
  });

  socket.on("notifyClassroom", ({ classroomId, users, creatorName, classroomName, startTime }) => {
    console.log(`Notifying users for classroom ${classroomId}:`, users);
    users.forEach((userId) => {
      const socketId = onlineUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit("classroomInvite", {
          classroomId,
          creator: userId,
          creatorName,
          classroomName,
          message: `You've been invited to join "${classroomName}" by ${creatorName} starting at ${new Date(startTime).toLocaleString()}. Join or decline?`,
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
    socket.join(`group_${groupId}`);
    console.log(`User ${userId} joined group chat room for group ${groupId}`);
    // Notify other members of the join (optional)
    const user = onlineUsers.get(userId);
    if (user) {
      io.to(`group_${groupId}`).emit("userJoinedGroup", { groupId, userId, userName: user.name || `User ${userId}` });
    }
    broadcastMemberCount(groupId);
  });

  socket.on("sendGroupMessage", async ({ userId, groupId, message, userName, audioUrl, audioDuration, fileUrl, fileName, messageId }) => {
    console.log(`Message from ${userId} (${userName}) in group ${groupId}:`, { message, audioUrl, fileUrl, fileName, messageId });
    let senderName = userName;
    if (!senderName) {
      const user = await User.findById(userId).select("name");
      senderName = user?.name || "Anonymous";
    }

    const messageData = {
      userId,
      groupId,
      message,
      audioUrl,
      audioDuration: audioDuration || 0,
      fileUrl,
      fileName: fileName || "Unnamed File",
      userName: senderName,
      timestamp: new Date().toISOString(),
      messageId: messageId || `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    try {
      await Message.create(messageData);
      io.to(`group_${groupId}`).emit("receiveGroupMessage", messageData);
      console.log(`Broadcasting message to group ${groupId}:`, messageData);
    } catch (error) {
      console.error("Error saving or broadcasting message:", error);
    }
  });

  socket.on("typing", ({ userId, userName, groupId }) => {
    console.log(`Broadcasting typing for user ${userName || userId} in group ${groupId}`);
    io.to(`group_${groupId}`).emit("typing", { userId, userName, groupId });
  });

  socket.on("leaveGroup", async ({ userId, groupId }) => {
    console.log(`User ${userId} attempting to leave group ${groupId}`);
    try {
      const group = await StudyGroup.findById(groupId);
      if (!group) throw new Error("Group not found");

      if (!Array.isArray(group.members)) {
        group.members = [];
      }

      if (!group.members.includes(userId)) {
        socket.emit("error", { message: "You are not a member of this group" });
        return;
      }

      group.members = group.members.filter((id) => id.toString() !== userId);
      group.membersCount = Math.max(0, group.members.length);
      await group.save();

      const user = await User.findById(userId);
      if (user) {
        user.joinedGroups = user.joinedGroups.filter((id) => id.toString() !== groupId);
        await user.save();
      }

      const updatedGroup = {
        _id: group._id,
        members: group.members,
        membersCount: group.membersCount,
        name: group.name,
      };
      io.emit("groupUpdated", updatedGroup);

      console.log(`User ${userId} successfully left group ${groupId}`);
    } catch (error) {
      console.error("Error leaving group:", error);
      socket.emit("error", { message: error.message });
    }
    updateOnlineUsers();
  });

  socket.on("classroomStarted", async ({ classroomId, roomName }) => {
    console.log(`Classroom ${classroomId} started with roomName: ${roomName}`);
    try {
      const Classroom = mongoose.model("Classroom");
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) throw new Error("Classroom not found");

      const usersToNotify = [...classroom.allowedUsers, classroom.creator].filter((userId, index, self) => self.indexOf(userId) === index);
      usersToNotify.forEach((userId) => {
        const socketId = onlineUsers.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit("classroomStarted", { classroomId, roomName });
          console.log(`Notified user ${userId} about classroom ${classroomId} start`);
        } else {
          console.warn(`User ${userId} not online for classroom ${classroomId} start notification`);
        }
      });
    } catch (error) {
      console.error("Error handling classroomStarted:", error);
    }
  });

  socket.on("classroomEnded", ({ classroomId }) => {
    console.log(`Classroom ${classroomId} ended`);
    io.emit("classroomEnded", { classroomId });
  });

  socket.on("classroomDeleted", ({ classroomId }) => {
    console.log(`Classroom ${classroomId} deleted`);
    io.emit("classroomDeleted", { classroomId });
    io.emit("clearInvitation", { classroomId });
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

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error.message);
  });
});

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
// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:5173",
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// }));

// Update CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://192.168.137.1:5173", // Add your frontend's origin
].filter(Boolean); // Remove undefined/null values

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman) or from allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Store io in app for use in routes (if needed)
app.set("io", io);

// Routes
app.use("/api", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/study-groups", studyGroupRoutes);
app.use("/api/classrooms", classroomRoutes);


const messageSchema = new mongoose.Schema({
    groupId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    message: { type: String },
    audioUrl: { type: String },
    audioDuration: { type: Number, default: 0 },
    fileUrl: { type: String },
    fileName: { type: String, default: "Unnamed File" },
    fileSizeKB: { type: Number },
    fileType: { type: String },
    timestamp: { type: Date, default: Date.now },
    messageId: { type: String, required: true, unique: true },
  });

const Message = mongoose.model('Message', messageSchema);

// GET messages for a group
app.get('/api/study-groups/:groupId/messages', authenticateUser, async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId }).sort('timestamp');
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

// POST a new message
app.post('/api/study-groups/messages', authenticateUser, async (req, res) => {
  try {
    const { userId, groupId, userName, message, timestamp, messageId, audioUrl, fileUrl } = req.body;
    const newMessage = new Message({ userId, groupId, userName, message, timestamp, messageId, audioUrl, fileUrl });
    await newMessage.save();
    res.status(201).json({ message: 'Message saved', messageId });
  } catch (error) {
    res.status(500).json({ message: 'Error saving message', error });
  }
});



// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});