import React, { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

  // Filter courses based on search input
  const filteredCourses = Object.keys(courseDetails).filter((course) =>
    courseDetails[course].title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center text-white"
      style={{ background: "#000000" }} // Black background from the image
    >
      {/* Page Header */}
      <h2 className="text-center fw-bold mb-4" style={{ color: "#ffffff" }}>
        Explore Our Courses
      </h2>

      {/* Search Bar */}
      <div
        className="d-flex align-items-center bg-dark text-white p-3 rounded w-50 shadow mb-4"
        style={{
          maxWidth: "600px",
          backgroundColor: "#2c2c2c", // Slightly lighter dark for search bar
          border: "1px solid #4a4a4a", // Subtle border for contrast
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        <span className="fs-4 me-2" style={{ color: "#9C27B0" }}>🔍</span>
        <input
          type="text"
          className="form-control bg-transparent border-0 text-white"
          placeholder="Search a Course"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // Update search query state
        />
      </div>

      {/* Course List */}
      <div className="row w-75">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div key={course} className="col-md-4 mb-4">
              <div
                className="card text-white p-4 text-center shadow-lg"
                style={{
                  backgroundColor: "#2c2c2c", // Dark gray background for cards
                  borderRadius: "12px", // Rounded corners like the image
                  border: "1px solid #4a4a4a", // Subtle border for contrast
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Subtle shadow
                  height: "250px", // Retain original height for consistency
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <h5 className="fw-bold" style={{ color: "#ffffff", fontSize: "1rem" }}>
                  {courseDetails[course].title}
                </h5>
                <p className="text-light" style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                  {courseDetails[course].description}
                </p>
                {/* Link to Course Description */}
                <Link
                  to={`/course/${course}`}
                  className="btn fw-bold"
                  style={{
                    backgroundColor: "#9C27B0", // Purple accent from the image
                    color: "#ffffff",
                    padding: "6px 15px", // Retain original padding
                    fontSize: "14px", // Retain original font size
                    width: "80%", // Retain original width
                    maxWidth: "150px", // Retain original max width
                    borderRadius: "5px", // Retain original border radius
                    transition: "background 0.3s ease-in-out", // Retain original transition
                    alignSelf: "center", // Retain original alignment
                    boxShadow: "0 2px 4px rgba(156, 39, 176, 0.3)", // Add subtle shadow
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#7B1FA2")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#9C27B0")}
                >
                  Enroll
                </Link>
              </div>
            </div>
          ))
        ) : (
          <h4 className="text-center mt-3" style={{ color: "#ffffff" }}>
            No courses found
          </h4>
        )}
      </div>
    </div>
  );
};

export default Courses;