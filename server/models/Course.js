import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  content:[{type: String}],
  description: String,
});

const Course = mongoose.model("Course", CourseSchema);
export default Course;