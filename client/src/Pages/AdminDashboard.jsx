import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [newCourse, setNewCourse] = useState({ title: "", instructor: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user" });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") {
      alert("Access denied. Admins only!");
      navigate("/");
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const groupRes = await fetch("http://localhost:5000/api/study-groups");
      const userRes = await fetch("http://localhost:5000/api/users");
      const courseRes = await fetch("http://localhost:5000/api/courses");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });

      if (response.ok) {
        alert("Study group created successfully!");
        setNewGroup({ name: "", description: "" });
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });

      if (response.ok) {
        alert("Course added successfully!");
        setNewCourse({ title: "", instructor: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating course:", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert("User created successfully!");
        setNewUser({ name: "", email: "", password: "", role: "user" });
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#2c2c2c" }}>
      {/* Sidebar Navigation */}
      <nav
        className="sidebar bg-dark text-white p-3"
        style={{
          width: "250px",
          position: "fixed",
          height: "100vh",
          boxShadow: "4px 0 10px rgba(0, 0, 0, 0.3)",
          backgroundColor: "#2c2c2c",
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
          {[
            { name: "Dashboard", icon: "🏠", section: "dashboard" },
            { name: "Users", icon: "👤", section: "users" },
            { name: "Groups", icon: "👥", section: "groups" },
            { name: "Courses", icon: "📚", section: "courses" },
          ].map((item) => (
            <li key={item.section} className="nav-item mb-3">
              <button
                className={`btn w-100 text-left py-3 d-flex align-items-center ${
                  item.section === "dashboard" ? "btn-purple" : ""
                }`}
                style={{
                  fontSize: "1rem",
                  fontWeight: "500",
                  borderRadius: "8px",
                  transition: "background-color 0.3s ease, transform 0.2s ease",
                  backgroundColor: item.section === "dashboard" ? "#9C27B0" : "transparent",
                  border: "none", // Flat design, no outline
                  color: "#ffffff",
                  boxShadow: item.section === "dashboard" ? "0 4px 6px rgba(156, 39, 176, 0.3)" : "none",
                  transform: item.section === "dashboard" ? "scale(1.02)" : "scale(1)",
                }}
                onClick={() => navigate(`/admin-dashboard#${item.section}`)}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.target.style.transform = item.section === "dashboard" ? "scale(1.02)" : "scale(1)")}
                aria-label={`Navigate to ${item.name}`}
              >
                <span className="me-2" style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                {item.name}
              </button>
            </li>
          ))}
          <li className="nav-item mb-3">
            <button
              className="btn btn-danger w-100 py-3 d-flex align-items-center"
              style={{
                fontSize: "1rem",
                fontWeight: "500",
                borderRadius: "8px",
                transition: "background-color 0.3s ease, transform 0.2s ease",
                backgroundColor: "#e74c3c",
                border: "none", // Flat design, no outline
                boxShadow: "0 4px 6px rgba(231, 76, 60, 0.3)",
              }}
              onClick={() => navigate("/")}
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
          borderRadius: "8px 0 0 8px",
          boxShadow: "-4px 0 10px rgba(0, 0, 0, 0.3)",
          transition: "margin-left 0.3s ease",
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
              Online: {users.filter(user => user.status === "online").length || 1}
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
              onClick={() => navigate("/")}
            >
              Logout
            </button>
          </div>
        </div>

        {/* User Creation */}
        <div
          className="card p-4 mb-4"
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            backgroundColor: "#3c3c3c",
            border: "1px solid #4a4a4a",
          }}
        >
          <h4
            className="mb-4"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#9C27B0",
              textAlign: "center",
            }}
          >
            Create User
          </h4>
          <form onSubmit={handleCreateUser} className="mb-3">
            <input
              type="text"
              placeholder="Name"
              className="form-control mb-2"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              style={{
                borderRadius: "8px",
                borderColor: "#4a4a4a",
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#2c2c2c",
                color: "#ffffff",
                transition: "border-color 0.3s ease",
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
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#2c2c2c",
                color: "#ffffff",
                transition: "border-color 0.3s ease",
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
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#2c2c2c",
                color: "#ffffff",
                transition: "border-color 0.3s ease",
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
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#2c2c2c",
                color: "#ffffff",
                transition: "border-color 0.3s ease",
              }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="btn btn-purple w-100"
              style={{
                backgroundColor: "#9C27B0",
                borderColor: "#9C27B0",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                borderRadius: "8px",
                transition: "background-color 0.3s ease, transform 0.2s ease",
                boxShadow: "0 4px 6px rgba(156, 39, 176, 0.3)",
              }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            >
              Create User
            </button>
          </form>
        </div>

        {/* Study Group Management */}
        <div
          className="card p-4 mb-4"
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            backgroundColor: "#3c3c3c",
            border: "1px solid #4a4a4a",
          }}
        >
          <h4
            className="mb-4"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#9C27B0",
              textAlign: "center",
            }}
          >
            Create Study Group
          </h4>
          <form onSubmit={handleCreateGroup} className="mb-3">
            <input
              type="text"
              placeholder="Group Name"
              className="form-control mb-2"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              style={{
                borderRadius: "8px",
                borderColor: "#4a4a4a",
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#2c2c2c",
                color: "#ffffff",
                transition: "border-color 0.3s ease",
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
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#2c2c2c",
                color: "#ffffff",
                transition: "border-color 0.3s ease",
              }}
              required
            ></textarea>
            <button
              type="submit"
              className="btn btn-purple w-100"
              style={{
                backgroundColor: "#9C27B0",
                borderColor: "#9C27B0",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                borderRadius: "8px",
                transition: "background-color 0.3s ease, transform 0.2s ease",
                boxShadow: "0 4px 6px rgba(156, 39, 176, 0.3)",
              }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            >
              Create Group
            </button>
          </form>
        </div>

        {/* Course Management */}
        <div
          className="card p-4 mb-4"
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            backgroundColor: "#3c3c3c",
            border: "1px solid #4a4a4a",
          }}
        >
          <h4
            className="mb-4"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#9C27B0",
              textAlign: "center",
            }}
          >
            Add Course
          </h4>
          <form onSubmit={handleCreateCourse} className="mb-3">
            <input
              type="text"
              placeholder="Course Title"
              className="form-control mb-2"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              style={{
                borderRadius: "8px",
                borderColor: "#4a4a4a",
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#2c2c2c",
                color: "#ffffff",
                transition: "border-color 0.3s ease",
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
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#2c2c2c",
                color: "#ffffff",
                transition: "border-color 0.3s ease",
              }}
              required
            />
            <button
              type="submit"
              className="btn btn-purple w-100"
              style={{
                backgroundColor: "#9C27B0",
                borderColor: "#9C27B0",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                borderRadius: "8px",
                transition: "background-color 0.3s ease, transform 0.2s ease",
                boxShadow: "0 4px 6px rgba(156, 39, 176, 0.3)",
              }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            >
              Add Course
            </button>
          </form>
        </div>

        {/* Display Study Groups */}
        <div
          className="card p-4 mb-4"
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            backgroundColor: "#3c3c3c",
            border: "1px solid #4a4a4a",
          }}
        >
          <h4
            className="mb-4"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#9C27B0",
              textAlign: "center",
            }}
          >
            Available Study Groups
          </h4>
          <ul
            className="list-group"
            style={{ maxHeight: "300px", overflowY: "auto" }}
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
                style={{ fontSize: "1.1rem", color: "#7f8c8d" }}
              >
                No study groups available.
              </p>
            )}
          </ul>
        </div>

        {/* Display Users */}
        <div
          className="card p-4 mb-4"
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            backgroundColor: "#3c3c3c",
            border: "1px solid #4a4a4a",
          }}
        >
          <h4
            className="mb-4"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#9C27B0",
              textAlign: "center",
            }}
          >
            Registered Users
          </h4>
          <ul
            className="list-group"
            style={{ maxHeight: "300px", overflowY: "auto" }}
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
                style={{ fontSize: "1.1rem", color: "#7f8c8d" }}
              >
                No users registered.
              </p>
            )}
          </ul>
        </div>

        {/* Display Courses */}
        <div
          className="card p-4 mb-4"
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            backgroundColor: "#3c3c3c",
            border: "1px solid #4a4a4a",
          }}
        >
          <h4
            className="mb-4"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#9C27B0",
              textAlign: "center",
            }}
          >
            Available Courses
          </h4>
          <ul
            className="list-group"
            style={{ maxHeight: "300px", overflowY: "auto" }}
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
                style={{ fontSize: "1.1rem", color: "#7f8c8d" }}
              >
                No courses available.
              </p>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;