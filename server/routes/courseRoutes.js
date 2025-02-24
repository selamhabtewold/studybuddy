import express from "express";
import Course from "../models/Course.js"; // <-- Ensure '.js' is included

const router = express.Router();

// ✅ Get all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses" });
  }
});

// ✅ Get courses based on category (recommendation)
router.get("/category/:category", async (req, res) => {
  try {
    const courses = await Course.find({ category: req.params.category });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses" });
  }
});

// ✅ Add a new course
router.post("/", async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(201).json({ message: "Course added successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error adding course" });
  }
});

// ✅ Delete a course
router.delete("/:id", async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course" });
  }
});


export default router;
