import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Course Details (Course names and descriptions)
const courseDetails = {
  DSA: { title: "Data Structures & Algorithms", description: "Enhance problem-solving skills with DSA." },
  PYTHON: { title: "Python Programming", description: "Master Python from basics to advanced concepts." },
  MATH: { title: "Mathematics for Computer Science", description: "Study key mathematical concepts for CS." },
  JAVA: { title: "Java Programming", description: "Master Java programming language and OOP." },
  AI: { title: "Artificial Intelligence", description: "Learn AI, machine learning, and deep learning." },
  ML: { title: "Machine Learning", description: "Understand machine learning algorithms and techniques." },
};

const Courses = () => {
  return (
    <div
      className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center text-white"
      style={{ background: "linear-gradient(to bottom, black, #003300)" }}
    >
      {/* Page Header */}
      <h2 className="text-center fw-bold mb-4">Explore Our Courses</h2>

      {/* Search Bar */}
      <div
        className="d-flex align-items-center bg-dark text-white p-3 rounded w-50 shadow mb-4"
        style={{ maxWidth: "600px" }}
      >
        <span className="fs-4 me-2">🔍</span>
        <input
          type="text"
          className="form-control bg-transparent border-0 text-white"
          placeholder="Search a Course"
        />
      </div>

      {/* Course List */}
      <div className="row w-75">
        {Object.keys(courseDetails).map((course) => (
          <div key={course} className="col-md-4 mb-4">
            <div
              className="card text-white p-4 text-center shadow-lg"
              style={{
                backgroundColor: "#222",
                height: "250px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <h5 className="fw-bold">{courseDetails[course].title}</h5>
              <p className="text-light">{courseDetails[course].description}</p>
              {/* Link to Course Description */}
              <Link
                to={`/course/${course}`}
                className="btn fw-bold"
                style={{
                  backgroundColor: "#0d6efd", // Matches "Start Course" button color
                  color: "white",
                  padding: "6px 15px", // Slightly smaller padding
                  fontSize: "14px", // Reduced font size
                  width: "80%", // Adjusted width
                  maxWidth: "150px", // Ensures it doesn't get too wide
                  borderRadius: "5px",
                  transition: "background 0.3s ease-in-out",
                  alignSelf: "center", // Centers the button
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")} // Matches green hover
                onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
              >
                Enroll
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
