import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Sample course materials data
const courseMaterials = {
  DSA: [
    { title: "Introduction to DSA", video: "https://example.com/intro.mp4", text: "Learn the basics of Data Structures and Algorithms.", task: "Define a data structure" },
    { title: "Arrays", video: "https://example.com/arrays.mp4", text: "Arrays are linear data structures used to store multiple items.", task: "Write an array reversal function" },
    { title: "Sorting Algorithms", video: "https://example.com/sorting.mp4", text: "Explore bubble, quick, and merge sort.", task: "Implement bubble sort" },
  ],
  PYTHON: [
    { title: "Python Basics", video: "https://example.com/python.mp4", text: "Python is a versatile language for various applications.", task: "Print 'Hello World'" },
    { title: "Functions", video: "https://example.com/functions.mp4", text: "Functions help modularize code.", task: "Write a function to add two numbers" },
  ],
  JAVA: [
    { title: "Java Basics", video: "https://example.com/java.mp4", text: "Java is known for platform independence.", task: "Create a simple class" },
    { title: "OOP Concepts", video: "https://example.com/oop.mp4", text: "Learn about inheritance and polymorphism.", task: "Implement an interface" },
  ],
};

const CourseMaterialPage = () => {
  const { courseName } = useParams();
  const [progress, setProgress] = useState({});
  const [activeModule, setActiveModule] = useState(null);

  const normalizedCourseName = courseName ? courseName.toUpperCase() : "";

  // Load progress from localStorage on mount
  useEffect(() => {
    const storedProgress = localStorage.getItem(`progress_${normalizedCourseName}`);
    if (storedProgress) {
      setProgress((prev) => ({ ...prev, [normalizedCourseName]: parseFloat(storedProgress) }));
    }
  }, [normalizedCourseName]);

  // Toggle module visibility
  const toggleModule = (index) => {
    setActiveModule(activeModule === index ? null : index);
  };

  // Mark module as complete and update progress
  const markModuleComplete = (index) => {
    const updatedProgress = { ...progress };
    const totalModules = courseMaterials[normalizedCourseName]?.length || 0;
    if (totalModules > 0) {
      updatedProgress[normalizedCourseName] = Math.min(
        ((index + 1) / totalModules) * 100,
        100
      );
      setProgress(updatedProgress);
      localStorage.setItem(`progress_${normalizedCourseName}`, updatedProgress[normalizedCourseName]);
    }
  };

  return (
    <div className="d-flex min-vh-100 text-white" style={{ background: "linear-gradient(to bottom, black, #003300)" }}>
      {/* Sidebar Section */}
      <div
        className="d-flex flex-column p-4"
        style={{ width: "250px", backgroundColor: "#222", minHeight: "100vh", boxShadow: "2px 0 5px rgba(255, 255, 255, 0.1)" }}
      >
        <h5 className="text-center fw-bold mb-3">Course Navigation</h5>
        <div
          className="p-3 mb-2 text-center fw-bold rounded active-section"
          style={{ backgroundColor: "#198754", color: "white" }}
        >
          Course Material {progress[normalizedCourseName] ? `(${Math.round(progress[normalizedCourseName])}%)` : ""}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="flex-grow-1 d-flex flex-column justify-content-between p-4">
        <div className="content-window flex-grow-1 bg-dark p-4 rounded">
          <div className="course-material-container h-100 d-flex flex-column">
            <h2 className="text-center fw-bold mb-4">{courseName} Course Material</h2>
            <div className="progress mb-4">
              <div
                className="progress-bar bg-success"
                style={{ width: `${progress[normalizedCourseName] || 0}%` }}
                aria-valuenow={progress[normalizedCourseName] || 0}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <div className="accordion flex-grow-1 overflow-auto">
              {courseMaterials[normalizedCourseName]?.map((module, index) => (
                <div key={index} className="accordion-item bg-dark text-white">
                  <h2 className="accordion-header">
                    <button
                      className="accordion-button bg-dark text-white"
                      type="button"
                      onClick={() => toggleModule(index)}
                    >
                      {module.title}
                    </button>
                  </h2>
                  <div className={`accordion-collapse collapse ${activeModule === index ? "show" : ""}`}>
                    <div className="accordion-body">
                      <video controls src={module.video} className="w-100 mb-3" />
                      <p>{module.text}</p>
                      <div className="task bg-secondary p-3 rounded">
                        <strong>Task:</strong> {module.task}
                        <button
                          className="btn btn-success mt-2 d-block"
                          onClick={() => markModuleComplete(index)}
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )) || <p className="text-center">No materials available for {courseName}.</p>}
            </div>
          </div>
        </div>

        <div className="navigation d-flex justify-content-between px-5 py-3">
          <button
            className="fw-bold px-4 py-2 border-0 rounded"
            style={{ backgroundColor: "#0d6efd", color: "white", transition: "background 0.3s ease-in-out" }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
          >
            Prev
          </button>
          <button
            className="fw-bold px-4 py-2 border-0 rounded"
            style={{ backgroundColor: "#0d6efd", color: "white", transition: "background 0.3s ease-in-out" }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
          >
            Next
          </button>
        </div>
      </div>

      <style jsx>{`
        .content-window { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 0; }
        .course-material-container { width: 100%; }
        .accordion-button { background-color: #333 !important; }
        .accordion-button:not(.collapsed) { color: #fff; }
        .task { border-left: 4px solid #198754; }
        .active-section { background-color: #198754 !important; }
      `}</style>
    </div>
  );
};

export default CourseMaterialPage;