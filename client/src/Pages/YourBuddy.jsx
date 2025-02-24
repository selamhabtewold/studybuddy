import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const YourBuddy = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [studyGroups, setStudyGroups] = useState([]);
  const [userId, setUserId] = useState("user123"); // Replace with actual user ID

  useEffect(() => {
    fetch("http://localhost:5000/api/study-groups")
      .then((res) => res.json())
      .then((data) => setStudyGroups(data.slice(0, 6))) // Get top 6 groups
      .catch((err) => console.error("Error fetching study groups:", err));
  }, []);

  const handleJoinGroup = async (groupId) => {
    const token = localStorage.getItem("token"); // Retrieve stored token
    if (!token) {
      alert("You must be logged in to join a group.");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/api/study-groups/join/${groupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send token for authentication
        },
      });
  
      if (!response.ok) throw new Error("Failed to join group");
  
      const updatedGroup = await response.json();
      setStudyGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === groupId ? { ...updatedGroup, members: [...group.members, updatedGroup.user] } : group
        )
      );
    } catch (error) {
      console.error("Error joining study group:", error);
    }
  };
  
  
  
  

  return (
    <div
      className="min-vh-100 text-white d-flex flex-column align-items-center justify-content-center"
      style={{ background: "linear-gradient(to bottom, black, #003300)" }}
    >
      {/* Page Header */}
      <h2 className="mt-4 text-center fw-bold">Connect With Your Study Buddy</h2>

      {/* Find Your Buddy Section */}
      <div className="d-flex flex-column align-items-center bg-transparent p-4 rounded shadow-lg mx-auto">
        <div className="dropdown">
          <button
            className="btn fw-bold dropdown-toggle px-4 py-2 shadow"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              backgroundColor: "#0d6efd",
              color: "white",
              borderRadius: "5px",
              transition: "background 0.3s ease-in-out",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
          >
            <span className="me-2 fs-5">🔍</span> Find Your Buddy
          </button>
          {dropdownOpen && (
            <ul
              className="dropdown-menu show p-2 border-0 shadow-lg"
              style={{ backgroundColor: "#222", color: "white", borderRadius: "5px" }}
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
          {studyGroups.map((group) => (
            <div key={group._id} className="col-md-4 mb-3">
              <div
                className="text-center text-white p-4 rounded shadow-lg border position-relative group-container"
                style={{ 
                  backgroundColor: "#222", 
                  borderColor: "#0d6efd", 
                  height: "250px", 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  transition: "transform 0.3s", 
                  position: "relative"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.querySelector(".tooltip-box").style.opacity = "1";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.querySelector(".tooltip-box").style.opacity = "0";
                }}
              >
                <img
                  src={group.image}
                  alt={group.name}
                  className="rounded"
                  style={{ width: "100%", height: "120px", objectFit: "cover" }}
                />
                <h5 className="fw-bold mt-2">{group.name} Group</h5>
                <p className="mb-1">Members: {group.members.length}</p>
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
                  onClick={() => handleJoinGroup(group._id)}
                >
                  Join now <span className="ms-1">➡️</span>
                </button>
                <div
                  className="position-absolute top-0 start-50 translate-middle-x p-1 bg-dark text-white rounded tooltip-box"
                  style={{ 
                    fontSize: "12px", 
                    maxWidth: "90%", 
                    opacity: "0", 
                    transition: "opacity 0.3s", 
                    pointerEvents: "none" 
                  }}
                >
                  {group.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YourBuddy;
