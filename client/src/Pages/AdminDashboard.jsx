import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext"; // Import useUser from context
import Swal from "sweetalert2"; // Optional: For custom alerts (install with `npm install sweetalert2`)

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser(); // Get user and logout from context
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [newCourse, setNewCourse] = useState({ title: "", instructor: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(true); // Add loading state for auth check
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Add state to track logout

  // Check role and fetch data on mount
  useEffect(() => {
    // Skip auth check if logging out
    if (isLoggingOut) {
      setIsLoggingOut(false); // Reset after skipping
      return;
    }

    const checkAuth = async () => {
      if (!user || !user.role) {
        const token = localStorage.getItem("authToken");
        if (!token) {
          // Use custom alert instead of default alert
          Swal.fire({
            title: "Access Denied",
            text: "Please log in as an admin.",
            icon: "warning",
            confirmButtonText: "OK",
            confirmButtonColor: "#9C27B0",
            background: "#2c2c2c",
            color: "#ffffff",
          }).then(() => {
            navigate("/login");
          });
          return;
        }

        try {
          const response = await fetch("http://localhost:5000/api/users/verify", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.role !== "admin") {
              Swal.fire({
                title: "Access Denied",
                text: "Admins only!",
                icon: "warning",
                confirmButtonText: "OK",
                confirmButtonColor: "#9C27B0",
                background: "#2c2c2c",
                color: "#ffffff",
              }).then(() => {
                navigate("/");
              });
              return;
            }
          } else {
            Swal.fire({
              title: "Session Expired",
              text: "Please log in again.",
              icon: "warning",
              confirmButtonText: "OK",
              confirmButtonColor: "#9C27B0",
              background: "#2c2c2c",
              color: "#ffffff",
            }).then(() => {
              navigate("/login");
            });
            return;
          }
        } catch (error) {
          console.error("Auth verification error:", error);
          Swal.fire({
            title: "Server Error",
            text: "Please try again.",
            icon: "error",
            confirmButtonText: "OK",
            confirmButtonColor: "#9C27B0",
            background: "#2c2c2c",
            color: "#ffffff",
          }).then(() => {
            navigate("/login");
          });
          return;
        }
      } else if (user.role !== "admin") {
        Swal.fire({
          title: "Access Denied",
          text: "Admins only!",
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#9C27B0",
          background: "#2c2c2c",
          color: "#ffffff",
        }).then(() => {
          navigate("/");
        });
        return;
      }

      setLoading(false); // Auth check complete
      fetchData(); // Fetch data only after auth is confirmed
    };

    checkAuth();
  }, [navigate, user, isLoggingOut]);

  const fetchData = async () => {
    try {
      const groupRes = await fetch("http://localhost:5000/api/study-groups", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const userRes = await fetch("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const courseRes = await fetch("http://localhost:5000/api/courses", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      setGroups(await groupRes.json());
      setUsers(await userRes.json());
      setCourses(await courseRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/study-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(newGroup),
      });

      if (response.ok) {
        alert("Study group created successfully!");
        setNewGroup({ name: "", description: "" });
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Failed to create group: ${errorData.message || "Server error"}`);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Error creating group. Check console for details.");
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(newCourse),
      });

      if (response.ok) {
        alert("Course added successfully!");
        setNewCourse({ title: "", instructor: "" });
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Failed to add course: ${errorData.message || "Server error"}`);
      }
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Error adding course. Check console for details.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert("User created successfully!");
        setNewUser({ name: "", email: "", password: "", role: "user" });
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Failed to create user: ${errorData.message || "Server error"}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user. Check console for details.");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setIsLoggingOut(true); // Set logout flag to skip auth check
      logout(); // Clear token and user state
      navigate("/login"); // Navigate before re-render
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: "#2c2c2c", color: "#ffffff" }}>
        <div className="spinner-border text-purple" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#2c2c2c" }}>
      {/* Sidebar Navigation */}
      <nav
        className="sidebar bg-dark text-white p-3"
        style={{
          width: "250px",
          position: "fixed",
          height: "100vh",
          backgroundColor: "#2c2c2c",
          borderRight: "1px solid #3c3c3c",
        }}
      >
        <h3
          className="mb-4 text-center"
          style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            color: "#ffffff",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.4)",
          }}
        >
          Study Buddy
        </h3>
        <ul className="nav flex-column">
          <li className="nav-item mb-3">
            <button
              className="btn w-100 text-left py-2 d-flex align-items-center"
              style={{
                fontSize: "1.1rem",
                fontWeight: "500",
                color: "#b0b0b0",
                backgroundColor: "transparent",
                border: "none",
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/admin-dashboard#apps")}
              onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.target.style.color = "#b0b0b0")}
            >
              <span className="me-2" style={{ fontSize: "1.2rem" }}>📱</span>
              Apps
            </button>
          </li>
          <li className="nav-item mb-3">
            <button
              className="btn w-100 text-left py-2 d-flex align-items-center"
              style={{
                fontSize: "1.1rem",
                fontWeight: "500",
                color: "#b0b0b0",
                backgroundColor: "transparent",
                border: "none",
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/admin-dashboard#gaming")}
              onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.target.style.color = "#b0b0b0")}
            >
              <span className="me-2" style={{ fontSize: "1.2rem" }}>🎮</span>
              Gaming
            </button>
          </li>
          <li className="nav-item mb-3">
            <button
              className="btn w-100 text-left py-2 d-flex align-items-center"
              style={{
                fontSize: "1.1rem",
                fontWeight: "500",
                color: "#b0b0b0",
                backgroundColor: "transparent",
                border: "none",
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/admin-dashboard#dashboard")}
              onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.target.style.color = "#b0b0b0")}
            >
              <span className="me-2" style={{ fontSize: "1.2rem" }}>🏠</span>
              Dashboard
            </button>
          </li>
          <li className="nav-item mb-3">
            <button
              className="btn w-100 text-left py-2 d-flex align-items-center"
              style={{
                fontSize: "1.1rem",
                fontWeight: "500",
                color: "#b0b0b0",
                backgroundColor: "transparent",
                border: "none",
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/admin-dashboard#users")}
              onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.target.style.color = "#b0b0b0")}
            >
              <span className="me-2" style={{ fontSize: "1.2rem" }}>👤</span>
              Users
            </button>
          </li>
          <li className="nav-item mb-3">
            <button
              className="btn w-100 text-left py-2 d-flex align-items-center"
              style={{
                fontSize: "1.1rem",
                fontWeight: "500",
                color: "#b0b0b0",
                backgroundColor: "transparent",
                border: "none",
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/admin-dashboard#groups")}
              onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.target.style.color = "#b0b0b0")}
            >
              <span className="me-2" style={{ fontSize: "1.2rem" }}>👥</span>
              Groups
            </button>
          </li>
          <li className="nav-item mb-3">
            <button
              className="btn w-100 text-left py-2 d-flex align-items-center"
              style={{
                fontSize: "1.1rem",
                fontWeight: "500",
                color: "#b0b0b0",
                backgroundColor: "transparent",
                border: "none",
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/admin-dashboard#courses")}
              onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.target.style.color = "#b0b0b0")}
            >
              <span className="me-2" style={{ fontSize: "1.2rem" }}>📚</span>
              Courses
            </button>
          </li>
          <li className="nav-item mb-3">
            <button
              className="btn btn-danger w-100 py-2 d-flex align-items-center"
              style={{
                fontSize: "1.1rem",
                fontWeight: "500",
                borderRadius: "8px",
                transition: "background-color 0.3s ease, transform 0.2s ease",
                backgroundColor: "#e74c3c",
                border: "none",
                boxShadow: "0 4px 6px rgba(231, 76, 60, 0.3)",
              }}
              onClick={handleLogout}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              aria-label="Logout"
            >
              <span className="me-2" style={{ fontSize: "1.2rem" }}>🚪</span>
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main
        className="flex-grow-1 p-4"
        style={{
          marginLeft: "250px",
          backgroundColor: "#2c2c2c",
          padding: "20px",
        }}
      >
        {/* Top Navigation Bar */}
        <div
          className="d-flex justify-content-between align-items-center mb-4 p-3"
          style={{
            backgroundColor: "#3c3c3c",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div className="d-flex align-items-center">
            <span
              className="me-2"
              style={{ fontSize: "2rem", color: "#9C27B0" }}
            >
              👨‍🏫
            </span>
            <h3
              className="mb-0"
              style={{ fontSize: "1.5rem", color: "#ffffff" }}
            >
              Admin Dashboard
            </h3>
          </div>
          <div className="d-flex align-items-center">
            <button
              className="btn btn-purple me-2"
              style={{
                backgroundColor: "#9C27B0",
                borderColor: "#9C27B0",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                borderRadius: "8px",
                transition: "background-color 0.3s ease",
                boxShadow: "0 2px 4px rgba(156, 39, 176, 0.3)",
              }}
            >
              Online: {users.filter((user) => user.status === "online").length || 1}
            </button>
            <button
              className="btn btn-purple"
              style={{
                backgroundColor: "#9C27B0",
                borderColor: "#9C27B0",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                borderRadius: "8px",
                transition: "background-color 0.3s ease",
                boxShadow: "0 2px 4px rgba(156, 39, 176, 0.3)",
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Grid Layout for Sections */}
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {/* User Creation Card */}
          <div className="col">
            <div
              className="card p-3"
              style={{
                backgroundColor: "#3c3c3c",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                border: "1px solid #4a4a4a",
                height: "100%",
              }}
            >
              <h4
                className="mb-3 text-center"
                style={{ fontSize: "1.2rem", color: "#9C27B0", fontWeight: "600" }}
              >
                👤 Create User
              </h4>
              <form onSubmit={handleCreateUser}>
                <input
                  type="text"
                  placeholder="Name"
                  className="form-control mb-2"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#4a4a4a",
                    padding: "0.5rem",
                    backgroundColor: "#2c2c2c",
                    color: "#ffffff",
                  }}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="form-control mb-2"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#4a4a4a",
                    padding: "0.5rem",
                    backgroundColor: "#2c2c2c",
                    color: "#ffffff",
                  }}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="form-control mb-2"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#4a4a4a",
                    padding: "0.5rem",
                    backgroundColor: "#2c2c2c",
                    color: "#ffffff",
                  }}
                  required
                />
                <select
                  className="form-control mb-2"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#4a4a4a",
                    padding: "0.5rem",
                    backgroundColor: "#2c2c2c",
                    color: "#ffffff",
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="btn w-100"
                  style={{
                    backgroundColor: "#9C27B0",
                    border: "none",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    color: "#ffffff",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  Create
                </button>
              </form>
            </div>
          </div>

          {/* Study Group Card */}
          <div className="col">
            <div
              className="card p-3"
              style={{
                backgroundColor: "#3c3c3c",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                border: "1px solid #4a4a4a",
                height: "100%",
              }}
            >
              <h4
                className="mb-3 text-center"
                style={{ fontSize: "1.2rem", color: "#9C27B0", fontWeight: "600" }}
              >
                👥 Create Group
              </h4>
              <form onSubmit={handleCreateGroup}>
                <input
                  type="text"
                  placeholder="Group Name"
                  className="form-control mb-2"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#4a4a4a",
                    padding: "0.5rem",
                    backgroundColor: "#2c2c2c",
                    color: "#ffffff",
                  }}
                  required
                />
                <textarea
                  placeholder="Description"
                  className="form-control mb-2"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#4a4a4a",
                    padding: "0.5rem",
                    backgroundColor: "#2c2c2c",
                    color: "#ffffff",
                  }}
                  required
                ></textarea>
                <button
                  type="submit"
                  className="btn w-100"
                  style={{
                    backgroundColor: "#9C27B0",
                    border: "none",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    color: "#ffffff",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  Create
                </button>
              </form>
            </div>
          </div>

          {/* Course Card */}
          <div className="col">
            <div
              className="card p-3"
              style={{
                backgroundColor: "#3c3c3c",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                border: "1px solid #4a4a4a",
                height: "100%",
              }}
            >
              <h4
                className="mb-3 text-center"
                style={{ fontSize: "1.2rem", color: "#9C27B0", fontWeight: "600" }}
              >
                📚 Add Course
              </h4>
              <form onSubmit={handleCreateCourse}>
                <input
                  type="text"
                  placeholder="Course Title"
                  className="form-control mb-2"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#4a4a4a",
                    padding: "0.5rem",
                    backgroundColor: "#2c2c2c",
                    color: "#ffffff",
                  }}
                  required
                />
                <input
                  type="text"
                  placeholder="Instructor"
                  className="form-control mb-2"
                  value={newCourse.instructor}
                  onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                  style={{
                    borderRadius: "8px",
                    borderColor: "#4a4a4a",
                    padding: "0.5rem",
                    backgroundColor: "#2c2c2c",
                    color: "#ffffff",
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn w-100"
                  style={{
                    backgroundColor: "#9C27B0",
                    border: "none",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    color: "#ffffff",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Display Study Groups */}
          <div className="col">
            <div
              className="card p-3"
              style={{
                backgroundColor: "#3c3c3c",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                border: "1px solid #4a4a4a",
                height: "100%",
              }}
            >
              <h4
                className="mb-3 text-center"
                style={{ fontSize: "1.2rem", color: "#9C27B0", fontWeight: "600" }}
              >
                👥 Study Groups
              </h4>
              <ul
                className="list-group"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {groups.map((group) => (
                  <li
                    key={group._id}
                    className="list-group-item py-2"
                    style={{
                      backgroundColor: "#2c2c2c",
                      borderColor: "#4a4a4a",
                      color: "#ffffff",
                      borderRadius: "6px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {group.name} - {group.description}
                  </li>
                ))}
                {groups.length === 0 && (
                  <p
                    className="text-muted text-center"
                    style={{ fontSize: "1rem", color: "#7f8c8d" }}
                  >
                    No study groups available.
                  </p>
                )}
              </ul>
            </div>
          </div>

          {/* Display Users */}
          <div className="col">
            <div
              className="card p-3"
              style={{
                backgroundColor: "#3c3c3c",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                border: "1px solid #4a4a4a",
                height: "100%",
              }}
            >
              <h4
                className="mb-3 text-center"
                style={{ fontSize: "1.2rem", color: "#9C27B0", fontWeight: "600" }}
              >
                👤 Users
              </h4>
              <ul
                className="list-group"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {users.map((user) => (
                  <li
                    key={user._id}
                    className="list-group-item py-2"
                    style={{
                      backgroundColor: "#2c2c2c",
                      borderColor: "#4a4a4a",
                      color: "#ffffff",
                      borderRadius: "6px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {user.name} - {user.email}
                  </li>
                ))}
                {users.length === 0 && (
                  <p
                    className="text-muted text-center"
                    style={{ fontSize: "1rem", color: "#7f8c8d" }}
                  >
                    No users registered.
                  </p>
                )}
              </ul>
            </div>
          </div>

          {/* Display Courses */}
          <div className="col">
            <div
              className="card p-3"
              style={{
                backgroundColor: "#3c3c3c",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                border: "1px solid #4a4a4a",
                height: "100%",
              }}
            >
              <h4
                className="mb-3 text-center"
                style={{ fontSize: "1.2rem", color: "#9C27B0", fontWeight: "600" }}
              >
                📚 Courses
              </h4>
              <ul
                className="list-group"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {courses.map((course) => (
                  <li
                    key={course._id}
                    className="list-group-item py-2"
                    style={{
                      backgroundColor: "#2c2c2c",
                      borderColor: "#4a4a4a",
                      color: "#ffffff",
                      borderRadius: "6px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {course.title} - {course.instructor}
                  </li>
                ))}
                {courses.length === 0 && (
                  <p
                    className="text-muted text-center"
                    style={{ fontSize: "1rem", color: "#7f8c8d" }}
                  >
                    No courses available.
                  </p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;