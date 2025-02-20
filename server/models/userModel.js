import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

// Export the model correctly using ES module syntax
const User = mongoose.model('User', userSchema);
export default User;
