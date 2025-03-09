// models/classroom.js
import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isPublic: { type: Boolean, default: false },
  duration: { type: Number, required: true, min: 1 }, // Duration in minutes
  scheduledStartTime: { type: Date, required: true }, // When the session is scheduled to start
  startTime: { type: Date }, // When the session actually starts (set when session begins)
  endTime: { type: Date }, // When the session ends
  isActive: { type: Boolean, default: false }, // Track if the session is active (starts at scheduled time)
});

classroomSchema.pre("save", function(next) {
  // Ensure the creator is added to allowedUsers by default
  if (this.isNew && !this.allowedUsers.includes(this.creator)) {
    this.allowedUsers.push(this.creator);
  }
  next();
});

export default mongoose.model("Classroom", classroomSchema);