import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [newCourse, setNewCourse] = useState({ title: "", instructor: "" });

  // Fetch all data when the page loads
//   useEffect(() => {
//     const role = localStorage.getItem("userRole");
//     if (role !== "admin") {
//       alert("Access denied. Admins only!");
//       navigate("/");
//     }
//   }, []);
  useEffect(() => {
    fetchData();
  }, []);

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

  // Handle study group creation
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

  // Handle course creation
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

  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user" });

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
 const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const endpoint = isLogin ? "/api/users/login" : "/api/users/register";
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "user" }), // Ensure role defaults to "user"
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Success!");
        localStorage.setItem("userEmail", formData.email);
        localStorage.setItem("userRole", data.role); // Store role

        // Clear form after successful registration/login
        setFormData({ name: "", email: "", password: "" });

        if (data.role === "admin") {
          navigate("/admin-dashboard"); // Redirect admins
        } else {
          navigate("/preferences"); // Redirect users
        }
      } else {
        setMessage(data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Admin Dashboard</h2>


  {/* User Creation */}
  <div className="mt-4">
        <h4>Create User</h4>
        <form onSubmit={handleCreateUser} className="mb-3">
          <input type="text" placeholder="Name" className="form-control mb-2" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
          <input type="email" placeholder="Email" className="form-control mb-2" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
          <input type="password" placeholder="Password" className="form-control mb-2" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
          <select className="form-control mb-2" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn btn-primary w-100">Create User</button>
        </form>
      </div>

      {/* Study Group Management */}
      <div className="mt-4">
        <h4>Create Study Group</h4>
        <form onSubmit={handleCreateGroup} className="mb-3">
          <input
            type="text"
            placeholder="Group Name"
            className="form-control mb-2"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            className="form-control mb-2"
            value={newGroup.description}
            onChange={(e) =>
              setNewGroup({ ...newGroup, description: e.target.value })
            }
            required
          ></textarea>
          <button type="submit" className="btn btn-primary w-100">
            Create Group
          </button>
        </form>
      </div>

      {/* Course Management */}
      <div className="mt-4">
        <h4>Add Course</h4>
        <form onSubmit={handleCreateCourse} className="mb-3">
          <input
            type="text"
            placeholder="Course Title"
            className="form-control mb-2"
            value={newCourse.title}
            onChange={(e) =>
              setNewCourse({ ...newCourse, title: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Instructor"
            className="form-control mb-2"
            value={newCourse.instructor}
            onChange={(e) =>
              setNewCourse({ ...newCourse, instructor: e.target.value })
            }
            required
          />
          <button type="submit" className="btn btn-success w-100">
            Add Course
          </button>
        </form>
      </div>
      
     

      {/* Display Study Groups */}
      <div className="mt-5">
        <h4>Available Study Groups</h4>
        <ul className="list-group">
          {groups.map((group) => (
            <li key={group._id} className="list-group-item">
              {group.name} - {group.description}
            </li>
          ))}
        </ul>
      </div>

      {/* Display Users */}
      <div className="mt-4">
        <h4>Registered Users</h4>
        <ul className="list-group">
          {users.map((user) => (
            <li key={user._id} className="list-group-item">
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      </div>

      {/* Display Courses */}
      <div className="mt-4">
        <h4>Available Courses</h4>
        <ul className="list-group">
          {courses.map((course) => (
            <li key={course._id} className="list-group-item">
              {course.title} - {course.instructor}
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btn-danger mt-4" onClick={() => navigate("/")}>
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;
