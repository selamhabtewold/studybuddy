import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const CourseContent = () => {
  return (
    <div
      className="d-flex min-vh-100 text-white"
      style={{ background: "linear-gradient(to bottom, black, #003300)" }}
    >
      {/* Sidebar Section */}
      <div
        className="d-flex flex-column p-4"
        style={{
          width: "250px",
          backgroundColor: "#222",
          minHeight: "100vh",
          boxShadow: "2px 0 5px rgba(255, 255, 255, 0.1)",
        }}
      >
        <h5 className="text-center fw-bold mb-3">Course Navigation</h5>
        {["Course Name", "Course Material", "Grade", "Notes", "Course Info"].map(
          (item, index) => (
            <div
              key={index}
              className="p-3 mb-2 text-center fw-bold rounded"
              style={{
                backgroundColor: "#0d6efd",
                color: "white",
                cursor: "pointer",
                transition: "background 0.3s ease-in-out",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
            >
              {item}
            </div>
          )
        )}
      </div>

      {/* Main Content Section */}
      <div className="flex-grow-1 d-flex flex-column justify-content-between p-4">
        {/* Course Content Window */}
        <div className="content-window text-center flex-grow-1 d-flex align-items-center justify-content-center bg-dark p-4 rounded">
          <h2 className="fw-bold">Course Content Window</h2>
        </div>

        {/* Navigation Section */}
        <div className="navigation d-flex justify-content-between px-5 py-3">
          <button
            className="fw-bold px-4 py-2 border-0 rounded"
            style={{
              backgroundColor: "#0d6efd",
              color: "white",
              transition: "background 0.3s ease-in-out",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
          >
            Prev
          </button>

          <button
            className="fw-bold px-4 py-2 border-0 rounded"
            style={{
              backgroundColor: "#0d6efd",
              color: "white",
              transition: "background 0.3s ease-in-out",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseContent;
