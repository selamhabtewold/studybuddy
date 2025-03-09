import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const CourseContent = () => {
  return (
    <div
      className="d-flex min-vh-100 text-white"
      style={{ background: "#000000" }} // Black background from the image
    >
      {/* Sidebar Section */}
      <div
        className="d-flex flex-column p-4"
        style={{
          width: "250px",
          backgroundColor: "#2c2c2c", // Dark gray background for sidebar, matching reference cards
          minHeight: "100vh",
          boxShadow: "2px 0 5px rgba(0, 0, 0, 0.3)", // Updated shadow for dark theme
        }}
      >
        <h5 className="text-center fw-bold mb-3" style={{ color: "#ffffff" }}>
          Course Navigation
        </h5>
        {["Course Name", "Course Material", "Grade", "Notes", "Course Info"].map(
          (item, index) => (
            <div
              key={index}
              className="p-3 mb-2 text-center fw-bold rounded"
              style={{
                backgroundColor: "#9C27B0", // Purple accent from the image
                color: "#ffffff",
                cursor: "pointer",
                borderRadius: "8px", // Rounded corners like the reference
                transition: "background 0.3s ease-in-out",
                boxShadow: "0 2px 4px rgba(156, 39, 176, 0.3)", // Subtle shadow for buttons
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#7B1FA2")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#9C27B0")}
            >
              {item}
            </div>
          )
        )}
      </div>

      {/* Main Content Section */}
      <div className="flex-grow-1 d-flex flex-column justify-content-between p-4">
        {/* Course Content Window */}
        <div
          className="content-window text-center flex-grow-1 d-flex align-items-center justify-content-center bg-dark p-4 rounded"
          style={{
            backgroundColor: "#2c2c2c", // Dark gray background for content window, matching reference cards
            borderRadius: "12px", // Rounded corners like the reference
            border: "1px solid #4a4a4a", // Subtle border for contrast
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Subtle shadow
          }}
        >
          <h2 className="fw-bold" style={{ color: "#ffffff" }}>
            Course Content Window
          </h2>
        </div>

        {/* Navigation Section */}
        <div
          className="navigation d-flex justify-content-between px-5 py-3"
          style={{ backgroundColor: "transparent" }} // Keep navigation transparent for dark theme
        >
          <button
            className="fw-bold px-4 py-2 border-0 rounded"
            style={{
              backgroundColor: "#9C27B0", // Purple accent from the image
              color: "#ffffff",
              borderRadius: "8px", // Rounded corners like the reference
              transition: "background 0.3s ease-in-out",
              boxShadow: "0 2px 4px rgba(156, 39, 176, 0.3)", // Subtle shadow for buttons
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#7B1FA2")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#9C27B0")}
          >
            Prev
          </button>

          <button
            className="fw-bold px-4 py-2 border-0 rounded"
            style={{
              backgroundColor: "#9C27B0", // Purple accent from the image
              color: "#ffffff",
              borderRadius: "8px", // Rounded corners like the reference
              transition: "background 0.3s ease-in-out",
              boxShadow: "0 2px 4px rgba(156, 39, 176, 0.3)", // Subtle shadow for buttons
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#7B1FA2")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#9C27B0")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseContent;