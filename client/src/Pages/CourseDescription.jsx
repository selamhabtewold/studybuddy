import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Course details mock data with more content
const courseDetails = {
  DSA: {
    title: "Data Structures & Algorithms",
    description: "Master data structures and algorithms to solve complex problems.",
    contents: [
      "Introduction to Data Structures",
      "Arrays and Linked Lists",
      "Stacks and Queues",
      "Recursion and Backtracking",
      "Sorting and Searching Algorithms",
      "Graphs and Trees",
      "Dynamic Programming",
      "Time and Space Complexity Analysis",
      "Advanced Topics in DSA",
      "Interview Questions & Practice",
    ],
  },
  PYTHON: {
    title: "Python Programming",
    description: "Learn Python from basic syntax to advanced programming techniques.",
    contents: [
      "Introduction to Python",
      "Variables and Data Types",
      "Control Flow Statements",
      "Functions and Modules",
      "File Handling",
      "Object-Oriented Programming",
      "Exception Handling",
      "Data Structures in Python",
      "Python Libraries (NumPy, Pandas, Matplotlib)",
      "Web Scraping with Python",
      "Machine Learning with Python Basics",
    ],
  },
  JAVA: {
    title: "Java Programming",
    description: "Become proficient in Java programming with in-depth OOP concepts.",
    contents: [
      "Java Basics: Syntax & Structure",
      "Data Types and Variables",
      "Control Flow Statements",
      "Object-Oriented Programming in Java",
      "Interfaces and Abstract Classes",
      "Exception Handling in Java",
      "Multithreading and Concurrency",
      "Collections Framework",
      "Java Swing and GUI Development",
      "Spring Boot for Web Development",
    ],
  },
};

const CourseDescription = () => {
  const { courseName } = useParams();
  const navigate = useNavigate();
  const course = courseDetails[courseName] || {
    title: "Course Not Found",
    description: "No details available.",
    contents: [],
  };

  const handleStart = () => {
    navigate(`/course-content/${courseName}`);
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center text-white"
      style={{ background: "linear-gradient(to bottom, black, #003300)" }}
    >
      <div
        className="container p-5 rounded shadow-lg"
        style={{
          maxWidth: "900px",
          backgroundColor: "#222",
          border: "2px solid #0d6efd",
        }}
      >
        <div className="row">
          {/* Course Name Section */}
          <div className="col-md-4 d-flex align-items-center justify-content-center">
            <div
              className="text-center p-4 text-white rounded shadow"
              style={{ backgroundColor: "#0d6efd" }}
            >
              <h3 className="fw-bold">{courseName}</h3>
            </div>
          </div>

          {/* Course Description & Contents Section */}
          <div className="col-md-8">
            <h2 className="text-center fw-bold">{course.title}</h2>
            <div className="text-white p-3 rounded my-3 shadow" style={{ backgroundColor: "#0d6efd" }}>
              {course.description}
            </div>
            <h4 className="fw-bold">Course Contents</h4>

            {/* Scrollable Course Content List */}
            <div className="list-group mb-3 overflow-auto" style={{ maxHeight: "250px" }}>
              {course.contents.map((item, index) => (
                <div
                  key={index}
                  className="list-group-item text-white border-info"
                  style={{ backgroundColor: "#333" }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-between">
              <Link to="/courses" className="btn btn-secondary">
                Back to Courses
              </Link>
              <button
                onClick={handleStart}
                className="btn fw-bold"
                style={{
                  backgroundColor: "#0d6efd",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  transition: "background 0.3s ease-in-out",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
              >
                Start Course
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDescription;
