import mongoose from "mongoose";

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
    replyTo: { // New field for quoted message
      userName: String,
      message: String,
      timestamp: Date
    }
  });

const Message = mongoose.model("Message", messageSchema);
export default Message;