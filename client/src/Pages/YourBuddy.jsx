import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const YourBuddy = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div
      className="min-vh-100 text-white d-flex flex-column align-items-center justify-content-center"
      style={{ background: "linear-gradient(to bottom, black, #003300)" }}
    >
      {/* Page Header */}
      <h2 className="mt-4 text-center fw-bold">Connect With Your Study Buddy</h2>

      {/* Find Your Buddy Section */}
      <div className="d-flex flex-column align-items-center bg-transparent p-4 rounded shadow-lg mx-auto">
        {/* Find Your Buddy Button with Dropdown */}
        <div className="dropdown">
          <button
            className="btn fw-bold dropdown-toggle px-4 py-2 shadow"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              backgroundColor: "#0d6efd", // Matches "Start Course" button
              color: "white",
              borderRadius: "5px",
              transition: "background 0.3s ease-in-out",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")} // Green hover effect
            onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
          >
            <span className="me-2 fs-5">🔍</span> Find Your Buddy
          </button>
          {dropdownOpen && (
            <ul
              className="dropdown-menu show p-2 border-0 shadow-lg"
              style={{
                backgroundColor: "#222",
                color: "white",
                borderRadius: "5px",
              }}
            >
              <li className="dropdown-item text-white">Find Random Buddy</li>
              <li className="dropdown-item text-white">Find by Interests</li>
              <li className="dropdown-item text-white">Find Study Group</li>
            </ul>
          )}
        </div>

        {/* Online Status */}
        <div className="d-flex align-items-center mt-2">
          <span className="text-success me-2 fs-5">🟢</span>
          <span>Online: 5/1000</span>
        </div>
      </div>

      {/* Groups Section */}
      <div className="mt-5 w-75 mx-auto">
        <h4 className="fw-bold">
          <span role="img" aria-label="groups">👥</span> Groups to join
        </h4>
        <div className="row mt-3">
          {["DSA", "PYTHON", "MATH", "JAVA", "AI", "ML"].map((group, index) => (
            <div key={index} className="col-md-4 mb-3">
              <div
                className="text-center text-white p-4 rounded shadow-lg border"
                style={{ backgroundColor: "#222", borderColor: "#0d6efd" }}
              >
                <h5 className="fw-bold">{group} Group</h5>
                <button
                  className="btn fw-bold px-3 py-1 shadow-sm"
                  style={{
                    backgroundColor: "#0d6efd",
                    color: "white",
                    borderRadius: "5px",
                    transition: "background 0.3s ease-in-out",
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
                >
                  Join now <span className="ms-1">➡️</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YourBuddy;
