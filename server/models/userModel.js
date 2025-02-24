import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    interests:[{type: String}],
    subjects: [{type: String}],
    joinedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudyGroup" }],
});

// Export the model correctly using ES module syntax
const User = mongoose.model('User', userSchema);
export default User;
