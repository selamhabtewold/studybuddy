import express from "express";
import Message from "../models/messageModel.js";
import multer from "multer";
import path from "path";
import fs from "fs/promises"; // Use promises version of fs

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Store files in 'uploads' directory

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  req.user = { id: "testUserId" }; // Placeholder, replace with JWT logic
  next();
};

// Upload file
router.post("/send-file", authenticateToken, upload.single("file"), async (req, res) => {
  const { userId, groupId, userName } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(__dirname, "../uploads", fileName);
  await fs.rename(file.path, filePath); // Use fs.promises for async/await

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
  const fileSizeKB = (file.size / 1024).toFixed(2); // Size in KB
  const fileType = file.mimetype.split("/")[1].toUpperCase() || "FILE";

  console.log(`File uploaded: ${fileName}, URL: ${fileUrl}, Size: ${fileSizeKB} KB, Type: ${fileType}`);
  res.json({ fileUrl, fileName: file.originalname, fileSizeKB, fileType });
});

// Save message
router.post("/messages", authenticateToken, async (req, res) => {
  const { groupId, userId, userName, message, audioUrl, audioDuration, fileUrl, fileName, fileSizeKB, fileType, timestamp, messageId } = req.body;

  const newMessage = new Message({
    groupId,
    userId,
    userName,
    message,
    audioUrl,
    audioDuration: audioDuration || 0,
    fileUrl,
    fileName: fileName || "Unnamed File",
    fileSizeKB: fileSizeKB || 0,
    fileType: fileType || "FILE",
    timestamp: timestamp || new Date(),
    messageId: messageId || `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  });

  try {
    await newMessage.save();
    console.log(`Message saved for group ${groupId}, messageId: ${newMessage.messageId}`);
    res.status(201).json({ message: "Message saved", messageId: newMessage.messageId });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Failed to save message", details: error.message });
  }
});

// Get chat history
router.get("/:groupId/messages", authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  console.log(`Fetching messages for groupId: ${groupId}`);
  try {
    const messages = await Message.find({ groupId }).sort({ timestamp: 1 });
    console.log(`Found ${messages.length} messages for group ${groupId}:`, messages);
    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages", details: error.message });
  }
});

export default router;