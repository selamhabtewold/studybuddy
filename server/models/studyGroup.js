// models/studyGroupModel.js
import mongoose from "mongoose";

const studyGroupSchema = new mongoose.Schema({
  name: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  membersCount: { type: Number, default: 0 },
  image: String,
  description: String,
  subject: String, // Assuming subject exists for recommendations
});

export default mongoose.model("StudyGroup", studyGroupSchema);