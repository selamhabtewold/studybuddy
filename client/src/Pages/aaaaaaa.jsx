import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link for "See more"
import { io } from "socket.io-client";
import { useOnlineUsers } from "/src/context/OnlineUsersContext"; // Import the context

// ErrorBoundary remains unchanged
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="d-flex justify-content-center align-items-center vh-100"
          style={{
            backgroundColor: "#1a1d26",
            color: "#ff4444",
            fontSize: "1rem", // Smaller font size
            fontWeight: "500",
          }}
        >
          <div className="text-center">
            <p>Error: {this.state.error.message || "An unexpected error occurred."}</p>
            <button
              className="btn btn-purple mt-2" // Reduced margin
              style={{
                backgroundColor: "#9C27B0",
                borderColor: "#9C27B0",
                padding: "0.5rem 1.2rem", // Slightly smaller padding
                fontSize: "0.9rem", // Smaller font size
                borderRadius: "6px", // Slightly smaller radius
                transition: "background-color 0.3s ease",
                boxShadow: "0 2px 4px rgba(156, 39, 176, 0.2)", // Reduced shadow
              }}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [onlineUsers, setOnlineUsers] = useState({});
  const [classroomForm, setClassroomForm] = useState({
    name: "",
    selectedUsers: [],
    isPublic: false,
    duration: 60,
    scheduledStartTime: new Date().toISOString().slice(0, 16),
  });
  const [invitations, setInvitations] = useState([]);
  const [createdClassrooms, setCreatedClassrooms] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("userInfo");
  const [waitingForHost, setWaitingForHost] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const navigate = useNavigate();
  const { setOnlineUsersCount } = useOnlineUsers(); // Use context to set count

  const fetchCreatedClassrooms = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !user) return;
    try {
      const response = await fetch(`http://localhost:5000/api/classrooms?creator=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          setCreatedClassrooms([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCreatedClassrooms(data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      setError(error.message);
    }
  };

  const fetchAvailableGroups = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !user) return;
    try {
      const response = await fetch("http://localhost:5000/api/study-groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch available groups");
      const data = await response.json();
      console.log("Fetched available groups:", data); // Debug log
      setAvailableGroups(data.filter(group => !user.joinedGroups.some(g => g._id === group._id)));
    } catch (error) {
      console.error("Error fetching available groups:", error);
      setError(error.message);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeSocket = () => {
      const socketUrl = "http://localhost:5000";
      const newSocket = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ["websocket", "polling"],
        path: "/socket.io",
        autoConnect: false,
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("Connected to WebSocket with socket ID:", newSocket.id);
        const token = localStorage.getItem("authToken");
        if (token && mounted) {
          fetch(`${socketUrl}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => {
              if (!res.ok) throw new Error("Failed to authenticate user");
              return res.json();
            })
            .then((data) => {
              if (mounted && data._id) {
                newSocket.emit("userLoggedIn", data._id.toString());
              }
            })
            .catch((err) => {
              console.error("Error fetching user for login:", err);
              if (mounted) setError("Failed to authenticate with real-time updates. Please log in again.");
            });
        }
      });

      newSocket.on("onlineUsers", (usersByGroup) => {
        console.log("Received online users:", usersByGroup);
        if (mounted) {
          setOnlineUsers(usersByGroup);
          // Calculate unique active users
          const uniqueUsers = new Set(
            Object.values(usersByGroup).flatMap(group => group.map(user => user.userId))
          );
          setOnlineUsersCount(uniqueUsers.size);
        }
      });

      newSocket.on("classroomInvite", ({ classroomId, creator, creatorName, classroomName, message }) => {
        console.log("Received classroom invite:", { classroomId, creator, creatorName, classroomName, message });
        if (mounted && creator !== user?._id?.toString()) {
          setInvitations((prev) => {
            if (prev.some((inv) => inv.classroomId === classroomId)) return prev;
            return [
              ...prev,
              { classroomId, creator, creatorName, classroomName, message, responded: false },
            ];
          });
        }
      });

      newSocket.on("classroomStarted", ({ classroomId }) => {
        console.log("Classroom started:", classroomId);
        if (mounted && waitingForHost === classroomId) {
          navigate(`/classroom/${classroomId}`, {
            state: { user: { id: user._id?.toString(), name: user.name, email: user.email } },
          });
          setWaitingForHost(null);
        }
        if (mounted) fetchCreatedClassrooms();
      });

      newSocket.on("classroomUpdated", ({ classroomId, allowedUsers }) => {
        console.log("Classroom updated:", { classroomId, allowedUsers });
        if (mounted) fetchCreatedClassrooms();
      });

      newSocket.on("classroomEnded", ({ classroomId }) => {
        console.log("Classroom ended:", classroomId);
        if (mounted) {
          setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
          setWaitingForHost(null);
          fetchCreatedClassrooms();
        }
      });

      newSocket.on("classroomDeleted", ({ classroomId }) => {
        console.log("Classroom deleted:", classroomId);
        if (mounted) {
          setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
          setWaitingForHost(null);
          fetchCreatedClassrooms();
        }
      });

      newSocket.on("clearInvitation", ({ classroomId }) => {
        console.log("Clearing invitation for classroom:", classroomId);
        if (mounted) {
          setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
        }
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket.IO connection error:", err.message);
        if (mounted) setError(`WebSocket connection failed: ${err.message}. Retrying...`);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Disconnected from WebSocket:", reason);
        if (mounted && reason !== "io client disconnect") {
          setError(`Disconnected from real-time updates: ${reason}. Attempting to reconnect...`);
        }
      });

      newSocket.connect();
      setSocket(newSocket);
      return newSocket;
    };

    const fetchUserDetails = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!mounted) return;
        if (response.ok) {
          setUser(data);
          setFormData({ name: data.name, email: data.email });
          fetchCreatedClassrooms();
        } else {
          throw new Error(data.message || "Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        if (mounted) {
          setError(error.message || "Failed to load user details");
          navigate("/login");
        }
      }
    };

    fetchUserDetails();
    const socketInstance = initializeSocket();

    return () => {
      mounted = false;
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchAvailableGroups();
    }
  }, [user]);

  const handleJoinGroup = async (groupId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You must be logged in to join a group.");
      navigate("/login");
      return;
    }

    // Debug logging to check groupId and token
    console.log("Attempting to join group with ID:", groupId);
    console.log("Auth token:", token);

    // Validate groupId (MongoDB ObjectID format: 24 characters)
    if (!groupId || typeof groupId !== "string" || groupId.length !== 24) {
      alert("Invalid group ID. Please try again or contact support.");
      console.error("Invalid group ID:", groupId);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/study-groups/join/${groupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id }) // Explicitly send userId in the request body
      });
      const data = await response.json(); // Parse the response as JSON

      if (response.ok) {
        // Ensure the group object includes the name, fallback to finding the name from availableGroups if needed
        const joinedGroup = data.group || 
          availableGroups.find(g => g._id === groupId) || 
          { _id: groupId, name: "Unnamed Group" }; // Fallback if name is missing
        console.log("Joined group data:", joinedGroup); // Debug log to verify the response

        // Ensure the group name is included in the joinedGroups array
        const updatedUser = {
          ...user,
          joinedGroups: [...user.joinedGroups, { ...joinedGroup, name: joinedGroup.name || (availableGroups.find(g => g._id === groupId)?.name || "Unnamed Group") }],
        };
        setUser(updatedUser);
        setAvailableGroups(availableGroups.filter(g => g._id !== groupId));
        alert("Joined the group successfully!");
      } else {
        throw new Error(data.message || "Failed to join group");
      }
    } catch (error) {
      console.error("Error joining group:", {
        message: error.message || "Unknown error",
        groupId,
        token,
        status: error.response?.status || "No response",
        responseData: error.response?.data || "No data",
      });
      alert(`Error joining group: ${error.message || "An unknown error occurred. Check the console for details."}`);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Error: You must be logged in to create a classroom.");
      navigate("/login");
      return;
    }

    const payload = {
      name: classroomForm.name,
      isPublic: classroomForm.isPublic,
      selectedUsers: classroomForm.selectedUsers.filter((id) => id !== user._id?.toString()),
      duration: classroomForm.duration,
      scheduledStartTime: classroomForm.scheduledStartTime,
      creator: user._id?.toString(),
    };

    console.log("Creating classroom with payload:", payload);

    let response;
    try {
      response = await fetch("http://localhost:5000/api/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Server response:", { status: response.status, data });

      if (response.ok) {
        const classroomId = data._id || data.classroomId;
        socket.emit("notifyClassroom", {
          classroomId,
          users: payload.selectedUsers,
          creatorName: user.name,
          classroomName: payload.name,
          startTime: payload.scheduledStartTime,
        });
        alert("Classroom created and invitations sent!");
        setClassroomForm({
          name: "",
          selectedUsers: [],
          isPublic: false,
          duration: 60,
          scheduledStartTime: new Date().toISOString().slice(0, 16),
        });
        fetchCreatedClassrooms();
      } else {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating classroom:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        responseStatus: response ? response.status : "No response",
      });
      alert(`Error creating classroom: ${error.message}`);
    }
  };

  const handleInvitationResponse = (classroomId, response) => {
    if (socket) {
      socket.emit("classroomResponse", { classroomId, userId: user._id?.toString(), response });
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.classroomId === classroomId ? { ...inv, responded: true } : inv
        )
      );
      if (response === "accept") {
        setWaitingForHost(classroomId);
      }
    }
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    localStorage.removeItem("authToken");
    setUser(null);
    navigate("/login");
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch("http://localhost:5000/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setUser({ ...user, ...formData });
        setEditMode(false);
        alert("User information updated!");
      } else {
        throw new Error(data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`http://localhost:5000/api/study-groups/leave/${groupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const updatedUser = {
          ...user,
          joinedGroups: user.joinedGroups.filter((g) => g._id !== groupId),
        };
        setUser(updatedUser);
        fetchAvailableGroups();
        alert("Left the group successfully!");
      } else {
        throw new Error(data.message || "Failed to leave group");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleSetDuration = async (classroomId, duration) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}/duration`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Duration updated!");
        fetchCreatedClassrooms();
      } else {
        throw new Error(data.message || "Failed to update duration");
      }
    } catch (error) {
      console.error("Error setting duration:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleStartSession = async (classroomId) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}/start`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        socket.emit("classroomStarted", { classroomId });
        alert("Session started!");
        fetchCreatedClassrooms();
      } else {
        throw new Error(data.message || "Failed to start session");
      }
    } catch (error) {
      console.error("Error starting session:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEndSession = async (classroomId) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}/end`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        socket.emit("classroomEnded", { classroomId });
        alert("Session ended!");
        fetchCreatedClassrooms();
      } else {
        throw new Error(data.message || "Failed to end session");
      }
    } catch (error) {
      console.error("Error ending session:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteSession = async (classroomId) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        socket.emit("classroomDeleted", { classroomId });
        alert("Classroom deleted!");
        fetchCreatedClassrooms();
      } else {
        throw new Error(data.message || "Failed to delete classroom");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const toggleUserSelection = (userId) => {
    if (userId !== user._id?.toString()) {
      setClassroomForm((prev) => ({
        ...prev,
        selectedUsers: prev.selectedUsers.includes(userId)
          ? prev.selectedUsers.filter((id) => id !== userId)
          : [...prev.selectedUsers, userId],
      }));
    }
  };

  const handleGroupChat = (groupId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You must be logged in to access the group chat.");
      navigate("/login");
      return;
    }

    // Navigate to the group chat with the necessary state
    const group = user.joinedGroups.find(g => g._id === groupId);
    if (group) {
      navigate(`/groupchat/${groupId}`, {
        state: {
          groupName: group.name,
          userId: user._id,
          userName: user.name || "Anonymous",
        },
      });
    } else {
      alert("You are not a member of this group or the group could not be found.");
    }
  };

  if (error) {
    return (
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{
          backgroundColor: "#1a1d26",
          color: "#ff4444",
          fontSize: "1rem", // Smaller font size
          fontWeight: "500",
        }}
      >
        <div className="text-center">
          <p>Error: {error}</p>
          <button
            className="btn btn-purple mt-2" // Reduced margin
            style={{
              backgroundColor: "#9C27B0",
              borderColor: "#9C27B0",
              padding: "0.5rem 1.2rem", // Slightly smaller padding
              fontSize: "0.9rem", // Smaller font size
              borderRadius: "6px", // Slightly smaller radius
              transition: "background-color 0.3s ease",
              boxShadow: "0 2px 4px rgba(156, 39, 176, 0.2)", // Reduced shadow
            }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{
          backgroundColor: "#1a1d26",
          color: "#ffffff",
          fontSize: "1.2rem", // Slightly smaller font size
          fontWeight: "600",
        }}
      >
        <div className="text-center">
          <p>Loading user details...</p>
          <div className="spinner-border text-purple" role="status" style={{ color: "#9C27B0", width: "2rem", height: "2rem" }}> {/* Smaller spinner */}
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="d-flex" style={{ minHeight: "90vh", backgroundColor: "#1a1d26" }}> {/* Reduced height */}
        <nav
          className="sidebar bg-dark text-white p-2" // Reduced padding
          style={{
            width: "250px", // Sidebar width
            position: "fixed",
            height: "100vh",
            boxShadow: "2px 0 6px rgba(0, 0, 0, 0.2)", // Reduced shadow
            backgroundColor: "#2b2e3c",
          }}
        >
          <h3
            className="mb-3 text-center" // Reduced margin
            style={{
              fontSize: "1.2rem", // Smaller font size
              fontWeight: "700",
              color: "#ffffff",
              textShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)", // Reduced shadow
            }}
          >
            Study Buddy
          </h3>
          <ul className="nav flex-column">
            {[
              { name: "User Info", icon: "👤", section: "userInfo" },
              { name: "Joined Groups", icon: "👥", section: "joinedGroups" },
              { name: "Online Users", icon: "🌐", section: "onlineUsers" },
              { name: "Create Classroom", icon: "📚", section: "createClassroom" },
              { name: "Created Classrooms", icon: "🏫", section: "createdClassrooms" },
              { name: "Invitations", icon: "✉️", section: "invitations" },
            ].map((item) => (
              <li key={item.section} className="nav-item mb-2"> {/* Reduced margin */}
                <button
                  className={`btn w-100 text-left py-2 d-flex align-items-center ${activeSection === item.section ? "btn-purple" : ""}`} // Reduced padding
                  style={{
                    fontSize: "0.9rem", // Smaller font size
                    fontWeight: "500",
                    borderRadius: "6px", // Slightly smaller radius
                    transition: "background-color 0.3s ease, transform 0.2s ease",
                    backgroundColor: activeSection === item.section ? "#9C27B0" : "transparent",
                    border: "none",
                    color: "#ffffff",
                    boxShadow: activeSection === item.section ? "0 2px 4px rgba(156, 39, 176, 0.2)" : "none", // Reduced shadow
                    transform: activeSection === item.section ? "scale(1.01)" : "scale(1)", // Slightly smaller scale
                  }}
                  onClick={() => setActiveSection(item.section)}
                  onMouseEnter={(e) => (e.target.style.transform = "scale(1.01)")}
                  onMouseLeave={(e) => (e.target.style.transform = activeSection === item.section ? "scale(1.01)" : "scale(1)")}
                  aria-label={`Navigate to ${item.name}`}
                >
                  <span className="me-2" style={{ fontSize: "1rem" }}>{item.icon}</span> {/* Smaller icon size */}
                  {item.name}
                </button>
              </li>
            ))}
            <li className="nav-item mb-2"> {/* Reduced margin */}
              <button
                className="btn btn-danger w-100 py-2 d-flex align-items-center" // Reduced padding
                style={{
                  fontSize: "0.9rem", // Smaller font size
                  fontWeight: "500",
                  borderRadius: "6px", // Slightly smaller radius
                  transition: "background-color 0.3s ease, transform 0.2s ease",
                  backgroundColor: "#e74c3c",
                  border: "none",
                  boxShadow: "0 2px 4px rgba(231, 76, 60, 0.2)", // Reduced shadow
                }}
                onClick={handleLogout}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.01)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                aria-label="Logout"
              >
                <span className="me-2" style={{ fontSize: "1rem" }}>🚪</span> {/* Smaller icon size */}
                Logout
              </button>
            </li>
          </ul>
        </nav>

        <main
          className="flex-grow-1 p-3" // Reduced padding
          style={{
            marginLeft: "250px", // Adjusted for sidebar width
            backgroundColor: "#1a1d26",
            borderRadius: "6px 0 0 6px", // Slightly smaller radius
            boxShadow: "-2px 0 6px rgba(0, 0, 0, 0.2)", // Reduced shadow
            transition: "margin-left 0.3s ease",
          }}
        >
          {activeSection === "userInfo" && (
            <div
              className="card p-3 mb-3" // Reduced padding and margin
              style={{
                borderRadius: "10px", // Slightly smaller radius
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Reduced shadow
                backgroundColor: "#2b2e3c",
                border: "1px solid #3c3f4c",
                maxWidth: "800px", // Slightly smaller width
                margin: "0 auto", // Center the card
              }}
            >
              <h4
                className="mb-3" // Reduced margin
                style={{
                  fontSize: "1.2rem", // Smaller font size
                  fontWeight: "600",
                  color: "#9C27B0",
                  textAlign: "center",
                }}
              >
                User Information
              </h4>
              {editMode ? (
                <form onSubmit={handleUpdateUser}>
                  <div className="mb-2"> {/* Reduced margin */}
                    <label
                      htmlFor="nameInput"
                      className="form-label"
                      style={{ fontSize: "0.9rem", fontWeight: "500", color: "#ffffff" }} // Smaller font size
                    >
                      Name:
                    </label>
                    <input
                      type="text"
                      id="nameInput"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        borderRadius: "6px", // Slightly smaller radius
                        borderColor: "#4a4d5e",
                        padding: "0.5rem", // Slightly smaller padding
                        fontSize: "0.9rem", // Smaller font size
                        backgroundColor: "#3c3f4c",
                        color: "#ffffff",
                        transition: "border-color 0.3s ease",
                      }}
                      aria-label="Enter your name"
                    />
                  </div>
                  <div className="mb-2"> {/* Reduced margin */}
                    <label
                      htmlFor="emailInput"
                      className="form-label"
                      style={{ fontSize: "0.9rem", fontWeight: "500", color: "#ffffff" }} // Smaller font size
                    >
                      Email:
                    </label>
                    <input
                      type="email"
                      id="emailInput"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        borderRadius: "6px", // Slightly smaller radius
                        borderColor: "#4a4d5e",
                        padding: "0.5rem", // Slightly smaller padding
                        fontSize: "0.9rem", // Smaller font size
                        backgroundColor: "#3c3f4c",
                        color: "#ffffff",
                        transition: "border-color 0.3s ease",
                      }}
                      aria-label="Enter your email"
                    />
                  </div>
                  <div className="d-flex justify-content-between">
                    <button
                      type="submit"
                      className="btn btn-purple me-2"
                      style={{
                        backgroundColor: "#9C27B0",
                        borderColor: "#9C27B0",
                        padding: "0.5rem 1.2rem", // Slightly smaller padding
                        fontSize: "0.9rem", // Smaller font size
                        borderRadius: "6px", // Slightly smaller radius
                        transition: "background-color 0.3s ease, transform 0.2s ease",
                        boxShadow: "0 2px 4px rgba(156, 39, 176, 0.2)", // Reduced shadow
                      }}
                      onMouseEnter={(e) => (e.target.style.transform = "scale(1.01)")} // Slightly smaller scale
                      onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                      aria-label="Save user information"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-gray"
                      onClick={() => setEditMode(false)}
                      style={{
                        backgroundColor: "#7f8c8d",
                        borderColor: "#7f8c8d",
                        padding: "0.5rem 1.2rem", // Slightly smaller padding
                        fontSize: "0.9rem", // Smaller font size
                        borderRadius: "6px", // Slightly smaller radius
                        transition: "background-color 0.3s ease, transform 0.2s ease",
                        boxShadow: "0 2px 4px rgba(127, 140, 141, 0.2)", // Reduced shadow
                      }}
                      onMouseEnter={(e) => (e.target.style.transform = "scale(1.01)")} // Slightly smaller scale
                      onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center">
                  <p
                    className="mb-2" // Reduced margin
                    style={{
                      fontSize: "0.9rem", // Smaller font size
                      color: "#ffffff",
                      fontWeight: "500",
                    }}
                  >
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p
                    className="mb-3" // Reduced margin
                    style={{
                      fontSize: "0.9rem", // Smaller font size
                      color: "#ffffff",
                      fontWeight: "500",
                    }}
                  >
                    <strong>Role:</strong> {user.role}
                  </p>
                  <button
                    className="btn btn-purple"
                    onClick={() => setEditMode(true)}
                    style={{
                      backgroundColor: "#9C27B0",
                      borderColor: "#9C27B0",
                      padding: "0.5rem 1.2rem", // Slightly smaller padding
                      fontSize: "0.9rem", // Smaller font size
                      borderRadius: "6px", // Slightly smaller radius
                      transition: "background-color 0.3s ease, transform 0.2s ease",
                      boxShadow: "0 2px 4px rgba(156, 39, 176, 0.2)", // Reduced shadow
                    }}
                    onMouseEnter={(e) => (e.target.style.transform = "scale(1.01)")} // Slightly smaller scale
                    onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                    aria-label="Edit user information"
                  >
                    Update Info
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSection === "joinedGroups" && (
            <div
              className="card p-3 mb-3" // Reduced padding and margin
              style={{
                borderRadius: "10px", // Slightly smaller radius
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Reduced shadow
                backgroundColor: "#2b2e3c",
                border: "1px solid #3c3f4c",
                maxWidth: "800px", // Slightly smaller width
                margin: "0 auto", // Center the card
              }}
            >
              <h4
                className="mb-3 d-flex justify-content-between align-items-center" // Reduced margin, added flex for "See more"
                style={{
                  fontSize: "1.2rem", // Smaller font size
                  fontWeight: "600",
                  color: "#9C27B0",
                  textAlign: "center",
                }}
              >
                Joined Study Groups
                <Link
                  to="/all-joined-groups" // Hypothetical route for "See more"
                  className="text-muted"
                  style={{
                    fontSize: "0.9rem", // Smaller font size
                    color: "#7f8c8d",
                    textDecoration: "none",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#9C27B0")}
                  onMouseLeave={(e) => (e.target.style.color = "#7f8c8d")}
                >
                  See more
                </Link>
              </h4>
              <div
                className="d-flex flex-nowrap overflow-auto gap-3 pb-2"
                style={{
                  scrollbarWidth: "thin", // For Firefox
                  scrollbarColor: "#4a4d5e #2b2e3c", // For Firefox
                  msOverflowStyle: "none", // For IE/Edge
                  WebkitOverflowScrolling: "touch", // For iOS
                }}
              >
                {user.joinedGroups && user.joinedGroups.length > 0 ? (
                  user.joinedGroups.map((group) => (
                    <div
                      key={group._id}
                      className="card flex-shrink-0"
                      style={{
                        width: "300px", // Adjusted width to match the image
                        backgroundColor: "#3c3f4c", // Dark gray background from image
                        border: "1px solid #4a4d5e",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                        overflow: "hidden",
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.02)";
                        e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
                      }}
                    >
                      <div className="card-body p-2 d-flex justify-content-between align-items-center">
                        <h5
                          className="card-title mb-0"
                          style={{
                            fontSize: "0.9rem", // Smaller font size
                            color: "#ffffff",
                            fontWeight: "500",
                          }}
                        >
                          {group.name || "Unnamed Group"} {/* Use the actual group name or fallback to "Unnamed Group" */}
                        </h5>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-warning"
                            onClick={() => handleLeaveGroup(group._id)}
                            style={{
                              padding: "0.3rem 0.8rem", // Adjusted padding to match image
                              fontSize: "0.8rem", // Smaller font size
                              borderRadius: "5px", // Slightly rounded corners
                              backgroundColor: "#f1c40f", // Yellow background from image
                              borderColor: "#f1c40f",
                              color: "#000000", // Black text for contrast
                              transition: "background-color 0.3s ease, transform 0.2s ease",
                              boxShadow: "0 1px 2px rgba(241, 196, 15, 0.2)",
                            }}
                            onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
                            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                            aria-label={`Leave ${group.name || "Unnamed Group"}`}
                          >
                            Leave
                          </button>
                          <button
                            className="btn btn-purple"
                            onClick={() => handleGroupChat(group._id)}
                            style={{
                              padding: "0.3rem 0.8rem", // Adjusted padding to match image
                              fontSize: "0.8rem", // Smaller font size
                              borderRadius: "5px", // Slightly rounded corners
                              backgroundColor: "#9C27B0", // Purple background from image
                              borderColor: "#9C27B0",
                              color: "#ffffff", // White text for contrast
                              transition: "background-color 0.3s ease, transform 0.2s ease",
                              boxShadow: "0 1px 2px rgba(156, 39, 176, 0.2)",
                            }}
                            onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
                            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                            aria-label={`Chat with ${group.name || "Unnamed Group"}`}
                          >
                            Group Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p
                    className="text-muted text-center w-100"
                    style={{
                      fontSize: "0.9rem", // Smaller font size
                      fontStyle: "italic",
                      color: "#7f8c8d",
                    }}
                  >
                    You haven't joined any study groups yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeSection === "joinedGroups" && (
            <div
              className="card p-3 mb-3" // Reduced padding and margin
              style={{
                borderRadius: "10px", // Slightly smaller radius
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Reduced shadow
                backgroundColor: "#2b2e3c",
                border: "1px solid #3c3f4c",
                maxWidth: "800px", // Slightly smaller width
                margin: "0 auto", // Center the card
              }}
            >
              <h4
                className="mb-3 d-flex justify-content-between align-items-center" // Reduced margin, added flex for "See more"
                style={{
                  fontSize: "1.2rem", // Smaller font size
                  fontWeight: "600",
                  color: "#9C27B0",
                  textAlign: "center",
                }}
              >
                Available Study Groups
                <Link
                  to="/all-available-groups" // Hypothetical route for "See more"
                  className="text-muted"
                  style={{
                    fontSize: "0.9rem", // Smaller font size
                    color: "#7f8c8d",
                    textDecoration: "none",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#9C27B0")}
                  onMouseLeave={(e) => (e.target.style.color = "#7f8c8d")}
                >
                  See more
                </Link>
              </h4>
              <div
                className="d-flex flex-nowrap overflow-auto gap-3 pb-2"
                style={{
                  scrollbarWidth: "thin", // For Firefox
                  scrollbarColor: "#4a4d5e #2b2e3c", // For Firefox
                  msOverflowStyle: "none", // For IE/Edge
                  WebkitOverflowScrolling: "touch", // For iOS
                }}
              >
                {availableGroups.length > 0 ? (
                  availableGroups.map((group) => (
                    <div
                      key={group._id}
                      className="card flex-shrink-0"
                      style={{
                        width: "300px", // Adjusted width to match the image
                        backgroundColor: "#3c3f4c", // Dark gray background from image
                        border: "1px solid #4a4d5e",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                        overflow: "hidden",
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.02)";
                        e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
                      }}
                    >
                      <div className="card-body p-2 d-flex flex-column align-items-start">
                        <h5
                          className="card-title mb-2"
                          style={{
                            fontSize: "0.9rem", // Smaller font size
                            color: "#ffffff",
                            fontWeight: "500",
                          }}
                        >
                          {group.name || "Unnamed Group"} {/* Use the actual group name or fallback to "Unnamed Group" */}
                        </h5>
                        <button
                          className="btn btn-success w-100"
                          onClick={() => handleJoinGroup(group._id)}
                          style={{
                            padding: "0.3rem 0.8rem", // Adjusted padding to match image
                            fontSize: "0.8rem", // Smaller font size
                            borderRadius: "5px", // Slightly rounded corners
                            backgroundColor: "#28a745", // Green background from image
                            borderColor: "#28a745",
                            color: "#ffffff", // White text for contrast
                            transition: "background-color 0.3s ease, transform 0.2s ease",
                            boxShadow: "0 1px 2px rgba(40, 167, 69, 0.2)",
                          }}
                          onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
                          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                          aria-label={`Join ${group.name || "Unnamed Group"}`}
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p
                    className="text-muted text-center w-100"
                    style={{
                      fontSize: "0.9rem", // Smaller font size
                      fontStyle: "italic",
                      color: "#7f8c8d",
                    }}
                  >
                    No available study groups to join.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeSection === "onlineUsers" && (
            <div
              className="card p-3 mb-3" // Reduced padding and margin
              style={{
                borderRadius: "10px", // Slightly smaller radius
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Reduced shadow
                backgroundColor: "#2b2e3c",
                border: "1px solid #3c3f4c",
                maxWidth: "800px", // Slightly smaller width
                margin: "0 auto", // Center the card
              }}
            >
              <h4
                className="mb-3" // Reduced margin
                style={{
                  fontSize: "1.2rem", // Smaller font size
                  fontWeight: "600",
                  color: "#9C27B0",
                  textAlign: "center",
                }}
              >
                Online Users in Your Groups
              </h4>
              {user.joinedGroups && user.joinedGroups.length > 0 ? (
                user.joinedGroups.map((group) => (
                  <div key={group._id} className="mb-3"> {/* Reduced margin */}
                    <h5
                      className="mb-2" // Reduced margin
                      style={{
                        fontSize: "1rem", // Smaller font size
                        fontWeight: "600",
                        color: "#9C27B0",
                      }}
                    >
                      {group.name}
                    </h5>
                    <ul className="list-group">
                      {(onlineUsers[group._id] || []).length > 0 ? (
                        onlineUsers[group._id].map(({ userId, name }) => (
                          <li
                            key={userId}
                            className="list-group-item d-flex justify-content-between align-items-center py-1" // Reduced padding
                            style={{
                              borderRadius: "6px", // Slightly smaller radius
                              marginBottom: "0.2rem", // Reduced margin
                              backgroundColor: "#3c3f4c",
                              borderColor: "#4a4d5e",
                              transition: "background-color 0.3s ease",
                              color: "#ffffff",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem", // Smaller font size
                                fontWeight: "500",
                              }}
                            >
                              {user._id?.toString() === userId ? `${name}(me)` : name}
                            </span>
                            <input
                              type="checkbox"
                              checked={classroomForm.selectedUsers.includes(userId)}
                              onChange={() => toggleUserSelection(userId)}
                              className="form-check-input ms-1" // Reduced margin
                              disabled={userId === user._id?.toString()}
                              style={{
                                cursor: userId === user._id?.toString() ? "not-allowed" : "pointer",
                                transition: "opacity 0.3s ease",
                              }}
                              aria-label={`Select ${name} for classroom invitation`}
                            />
                          </li>
                        ))
                      ) : (
                        <p
                          className="text-muted"
                          style={{
                            fontSize: "0.8rem", // Smaller font size
                            fontStyle: "italic",
                            color: "#7f8c8d",
                          }}
                        >
                          No online users in this group.
                        </p>
                      )}
                    </ul>
                  </div>
                ))
              ) : (
                <p
                  className="text-muted text-center"
                  style={{
                    fontSize: "0.9rem", // Smaller font size
                    fontStyle: "italic",
                    color: "#7f8c8d",
                  }}
                >
                  Join a group to see online users.
                </p>
              )}
            </div>
          )}

          {activeSection === "createClassroom" && (
            <div
              className="card p-3 mb-3" // Reduced padding and margin
              style={{
                borderRadius: "10px", // Slightly smaller radius
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Reduced shadow
                backgroundColor: "#2b2e3c",
                border: "1px solid #3c3f4c",
                maxWidth: "800px", // Slightly smaller width
                margin: "0 auto", // Center the card
              }}
            >
              <h4
                className="mb-3" // Reduced margin
                style={{
                  fontSize: "1.2rem", // Smaller font size
                  fontWeight: "600",
                  color: "#9C27B0",
                  textAlign: "center",
                }}
              >
                Create a Classroom
              </h4>
              <form onSubmit={handleCreateClassroom}>
                <div className="mb-2"> {/* Reduced margin */}
                  <label
                    htmlFor="classroomName"
                    className="form-label"
                    style={{ fontSize: "0.9rem", fontWeight: "500", color: "#ffffff" }} // Smaller font size
                  >
                    Classroom Name:
                  </label>
                  <input
                    type="text"
                    id="classroomName"
                    className="form-control"
                    value={classroomForm.name}
                    onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                    required
                    style={{
                      borderRadius: "6px", // Slightly smaller radius
                      borderColor: "#4a4d5e",
                      padding: "0.5rem", // Slightly smaller padding
                      fontSize: "0.9rem", // Smaller font size
                      backgroundColor: "#3c3f4c",
                      color: "#ffffff",
                      transition: "border-color 0.3s ease",
                    }}
                    aria-label="Enter classroom name"
                  />
                </div>
                <div className="mb-2"> {/* Reduced margin */}
                  <label
                    htmlFor="duration"
                    className="form-label"
                    style={{ fontSize: "0.9rem", fontWeight: "500", color: "#ffffff" }} // Smaller font size
                  >
                    Duration (minutes):
                  </label>
                  <input
                    type="number"
                    id="duration"
                    className="form-control"
                    value={classroomForm.duration}
                    onChange={(e) =>
                      setClassroomForm({ ...classroomForm, duration: parseInt(e.target.value) || 60 })
                    }
                    min="1"
                    required
                    style={{
                      borderRadius: "6px", // Slightly smaller radius
                      borderColor: "#4a4d5e",
                      padding: "0.5rem", // Slightly smaller padding
                      fontSize: "0.9rem", // Smaller font size
                      backgroundColor: "#3c3f4c",
                      color: "#ffffff",
                      transition: "border-color 0.3s ease",
                    }}
                    aria-label="Enter classroom duration in minutes"
                  />
                </div>
                <div className="mb-2"> {/* Reduced margin */}
                  <label
                    htmlFor="startTime"
                    className="form-label"
                    style={{ fontSize: "0.9rem", fontWeight: "500", color: "#ffffff" }} // Smaller font size
                  >
                    Scheduled Start Time:
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    className="form-control"
                    value={classroomForm.scheduledStartTime}
                    onChange={(e) =>
                      setClassroomForm({ ...classroomForm, scheduledStartTime: e.target.value })
                    }
                    required
                    style={{
                      borderRadius: "6px", // Slightly smaller radius
                      borderColor: "#4a4d5e",
                      padding: "0.5rem", // Slightly smaller padding
                      fontSize: "0.9rem", // Smaller font size
                      backgroundColor: "#3c3f4c",
                      color: "#ffffff",
                      transition: "border-color 0.3s ease",
                    }}
                    aria-label="Select classroom start time"
                  />
                </div>
                <div className="mb-2"> {/* Reduced margin */}
                  <label
                    className="form-label"
                    style={{ fontSize: "0.9rem", fontWeight: "500", color: "#ffffff" }} // Smaller font size
                  >
                    Access:
                  </label>
                  <select
                    className="form-control"
                    value={classroomForm.isPublic}
                    onChange={(e) =>
                      setClassroomForm({ ...classroomForm, isPublic: e.target.value === "true" })
                    }
                    disabled
                    style={{
                      borderRadius: "6px", // Slightly smaller radius
                      borderColor: "#4a4d5e",
                      padding: "0.5rem", // Slightly smaller padding
                      fontSize: "0.9rem", // Smaller font size
                      backgroundColor: "#3c3f4c",
                      color: "#ffffff",
                      cursor: "not-allowed",
                    }}
                    aria-label="Classroom access type"
                  >
                    <option value="false">Private (Selected users only)</option>
                  </select>
                </div>
                <div className="mb-3"> {/* Reduced margin */}
                  <label
                    className="form-label"
                    style={{ fontSize: "0.9rem", fontWeight: "500", color: "#ffffff" }} // Smaller font size
                  >
                    Select Users to Invite:
                  </label>
                  <ul className="list-group">
                    {Object.entries(onlineUsers)
                      .flatMap(([, users]) => users)
                      .filter((user, index, self) => index === self.findIndex((u) => u.userId === user.userId))
                      .map(({ userId, name }) => (
                        <li
                          key={userId}
                          className="list-group-item d-flex justify-content-between align-items-center py-1" // Reduced padding
                          style={{
                            borderRadius: "6px", // Slightly smaller radius
                            marginBottom: "0.2rem", // Reduced margin
                            backgroundColor: "#3c3f4c",
                            borderColor: "#4a4d5e",
                            transition: "background-color 0.3s ease",
                            color: "#ffffff",
                          }}
                        >
                          <label
                            className="form-check-label d-flex align-items-center w-100"
                            style={{ fontSize: "0.8rem", fontWeight: "500" }} // Smaller font size
                          >
                            <input
                              type="checkbox"
                              className="form-check-input me-1" // Reduced margin
                              checked={classroomForm.selectedUsers.includes(userId)}
                              onChange={() => toggleUserSelection(userId)}
                              disabled={userId === user._id?.toString()}
                              style={{
                                cursor: userId === user._id?.toString() ? "not-allowed" : "pointer",
                                transition: "opacity 0.3s ease",
                              }}
                              aria-label={`Select ${name} for classroom invitation`}
                            />
                            {name} {userId === user._id?.toString() ? "(me)" : ""}
                          </label>
                        </li>
                      ))}
                  </ul>
                </div>
                <button
                  type="submit"
                  className="btn btn-purple w-100"
                  style={{
                    backgroundColor: "#9C27B0",
                    borderColor: "#9C27B0",
                    padding: "0.5rem 1.2rem", // Slightly smaller padding
                    fontSize: "0.9rem", // Smaller font size
                    borderRadius: "6px", // Slightly smaller radius
                    transition: "background-color 0.3s ease, transform 0.2s ease",
                    boxShadow: "0 2px 4px rgba(156, 39, 176, 0.2)", // Reduced shadow
                  }}
                  onMouseEnter={(e) => (e.target.style.transform = "scale(1.01)")} // Slightly smaller scale
                  onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                  aria-label="Create classroom and send invites"
                >
                  Create Classroom & Send Invites
                </button>
              </form>
            </div>
          )}

          {activeSection === "createdClassrooms" && (
            <div
              className="card p-3 mb-3" // Reduced padding and margin
              style={{
                borderRadius: "10px", // Slightly smaller radius
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Reduced shadow
                backgroundColor: "#2b2e3c",
                border: "1px solid #3c3f4c",
                maxWidth: "800px", // Slightly smaller width
                margin: "0 auto", // Center the card
              }}
            >
              <h4
                className="mb-3" // Reduced margin
                style={{
                  fontSize: "1.2rem", // Smaller font size
                  fontWeight: "600",
                  color: "#9C27B0",
                  textAlign: "center",
                }}
              >
                Your Created Classrooms
              </h4>
              {createdClassrooms.length > 0 ? (
                <ul className="list-group">
                  {createdClassrooms.map((classroom) => (
                    <li
                      key={classroom._id}
                      className="list-group-item py-2" // Reduced padding
                      style={{
                        borderRadius: "6px", // Slightly smaller radius
                        marginBottom: "0.3rem", // Reduced margin
                        backgroundColor: "#3c3f4c",
                        borderColor: "#4a4d5e",
                        transition: "background-color 0.3s ease",
                        color: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.9rem", // Smaller font size
                          fontWeight: "500",
                        }}
                      >
                        {classroom.name} - 
                        <span style={{ color: classroom.isActive ? "#9C27B0" : "#7f8c8d" }}>
                          {classroom.isActive ? "Active" : "Scheduled/Inactive"}
                        </span> -
                        Starts: {new Date(classroom.scheduledStartTime).toLocaleString()} -
                        Duration: {classroom.duration} minutes
                      </div>
                      <div className="mt-2 d-flex justify-content-between flex-wrap gap-1"> {/* Reduced margin and gap */}
                        <button
                          className="btn btn-blue btn-sm"
                          onClick={() =>
                            handleSetDuration(classroom._id, prompt("New duration (minutes):", classroom.duration) || classroom.duration)
                          }
                          disabled={classroom.isActive}
                          style={{
                            padding: "0.4rem 0.8rem", // Slightly smaller padding
                            fontSize: "0.8rem", // Smaller font size
                            borderRadius: "4px", // Slightly smaller radius
                            backgroundColor: "#2196F3",
                            borderColor: "#2196F3",
                            transition: "background-color 0.3s ease, transform 0.2s ease",
                            boxShadow: "0 1px 2px rgba(33, 150, 243, 0.2)", // Reduced shadow
                            opacity: classroom.isActive ? 0.6 : 1,
                            cursor: classroom.isActive ? "not-allowed" : "pointer",
                          }}
                          onMouseEnter={(e) => !classroom.isActive && (e.target.style.transform = "scale(1.02)")} // Slightly smaller scale
                          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                          aria-label="Update classroom duration"
                        >
                          Update Duration
                        </button>
                        <button
                          className="btn btn-purple btn-sm"
                          onClick={() => handleStartSession(classroom._id)}
                          disabled={classroom.isActive || new Date() < new Date(classroom.scheduledStartTime)}
                          style={{
                            padding: "0.4rem 0.8rem", // Slightly smaller padding
                            fontSize: "0.8rem", // Smaller font size
                            borderRadius: "4px", // Slightly smaller radius
                            backgroundColor: "#9C27B0",
                            borderColor: "#9C27B0",
                            transition: "background-color 0.3s ease, transform 0.2s ease",
                            boxShadow: "0 1px 2px rgba(156, 39, 176, 0.2)", // Reduced shadow
                            opacity: classroom.isActive || new Date() < new Date(classroom.scheduledStartTime) ? 0.6 : 1,
                            cursor: classroom.isActive || new Date() < new Date(classroom.scheduledStartTime) ? "not-allowed" : "pointer",
                          }}
                          onMouseEnter={(e) => !(classroom.isActive || new Date() < new Date(classroom.scheduledStartTime)) && (e.target.style.transform = "scale(1.02)")} // Slightly smaller scale
                          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                          aria-label="Start classroom session"
                        >
                          Start Session
                        </button>
                        <button
                          className="btn btn-yellow btn-sm"
                          onClick={() => handleEndSession(classroom._id)}
                          disabled={!classroom.isActive}
                          style={{
                            padding: "0.4rem 0.8rem", // Slightly smaller padding
                            fontSize: "0.8rem", // Smaller font size
                            borderRadius: "4px", // Slightly smaller radius
                            backgroundColor: "#f1c40f",
                            borderColor: "#f1c40f",
                            transition: "background-color 0.3s ease, transform 0.2s ease",
                            boxShadow: "0 1px 2px rgba(241, 196, 15, 0.2)", // Reduced shadow
                            opacity: !classroom.isActive ? 0.6 : 1,
                            cursor: !classroom.isActive ? "not-allowed" : "pointer",
                          }}
                          onMouseEnter={(e) => classroom.isActive && (e.target.style.transform = "scale(1.02)")} // Slightly smaller scale
                          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                          aria-label="End classroom session"
                        >
                          End Session
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteSession(classroom._id)}
                          style={{
                            padding: "0.4rem 0.8rem", // Slightly smaller padding
                            fontSize: "0.8rem", // Smaller font size
                            borderRadius: "4px", // Slightly smaller radius
                            backgroundColor: "#e74c3c",
                            borderColor: "#e74c3c",
                            transition: "background-color 0.3s ease, transform 0.2s ease",
                            boxShadow: "0 1px 2px rgba(231, 76, 60, 0.2)", // Reduced shadow
                          }}
                          onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")} // Slightly smaller scale
                          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                          aria-label="Delete classroom"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className="text-muted text-center"
                  style={{
                    fontSize: "0.9rem", // Smaller font size
                    fontStyle: "italic",
                    color: "#7f8c8d",
                  }}
                >
                  You haven’t created any classrooms yet.
                </p>
              )}
            </div>
          )}

          {activeSection === "invitations" && (
            <div
              className="card p-3 mb-3" // Reduced padding and margin
              style={{
                borderRadius: "10px", // Slightly smaller radius
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)", // Reduced shadow
                backgroundColor: "#2b2e3c",
                border: "1px solid #3c3f4c",
                maxWidth: "800px", // Slightly smaller width
                margin: "0 auto", // Center the card
              }}
            >
              <h4
                className="mb-3" // Reduced margin
                style={{
                  fontSize: "1.2rem", // Smaller font size
                  fontWeight: "600",
                  color: "#9C27B0",
                  textAlign: "center",
                }}
              >
                Pending Invitations
              </h4>
              {invitations.length > 0 ? (
                <ul className="list-group">
                  {invitations.map((inv, index) =>
                    !inv.responded ? (
                      <li
                        key={index}
                        className="list-group-item d-flex justify-content-between align-items-center py-2" // Reduced padding
                        style={{
                          borderRadius: "6px", // Slightly smaller radius
                          marginBottom: "0.3rem", // Reduced margin
                          backgroundColor: "#3c3f4c",
                          borderColor: "#4a4d5e",
                          transition: "background-color 0.3s ease",
                          color: "#ffffff",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.9rem", // Smaller font size
                            fontWeight: "500",
                          }}
                        >
                          {inv.message}
                        </span>
                        <div>
                          <button
                            className="btn btn-blue btn-sm me-2"
                            onClick={() => handleInvitationResponse(inv.classroomId, "accept")}
                            style={{
                              padding: "0.4rem 0.8rem", // Slightly smaller padding
                              fontSize: "0.8rem", // Smaller font size
                              borderRadius: "4px", // Slightly smaller radius
                              backgroundColor: "#2196F3",
                              borderColor: "#2196F3",
                              transition: "background-color 0.3s ease, transform 0.2s ease",
                              boxShadow: "0 1px 2px rgba(33, 150, 243, 0.2)", // Reduced shadow
                            }}
                            onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")} // Slightly smaller scale
                            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                            aria-label={`Accept invitation to ${inv.classroomName}`}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-gray btn-sm"
                            onClick={() => handleInvitationResponse(inv.classroomId, "decline")}
                            style={{
                              padding: "0.4rem 0.8rem", // Slightly smaller padding
                              fontSize: "0.8rem", // Smaller font size
                              borderRadius: "4px", // Slightly smaller radius
                              backgroundColor: "#7f8c8d",
                              borderColor: "#7f8c8d",
                              transition: "background-color 0.3s ease, transform 0.2s ease",
                              boxShadow: "0 1px 2px rgba(127, 140, 141, 0.2)", // Reduced shadow
                            }}
                            onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")} // Slightly smaller scale
                            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                            aria-label={`Decline invitation to ${inv.classroomName}`}
                          >
                            Decline
                          </button>
                        </div>
                      </li>
                    ) : waitingForHost === inv.classroomId ? (
                      <li
                        key={index}
                        className="list-group-item text-center py-2" // Reduced padding
                        style={{
                          borderRadius: "6px", // Slightly smaller radius
                          backgroundColor: "#3c3f4c",
                          borderColor: "#4a4d5e",
                          fontSize: "0.9rem", // Smaller font size
                          color: "#ffffff",
                          fontWeight: "500",
                        }}
                      >
                        Waiting for host to start the meeting for "{inv.classroomName}"...
                        <div className="spinner-border text-purple mt-1" role="status" style={{ color: "#9C27B0", width: "1.5rem", height: "1.5rem" }}> {/* Smaller spinner */}
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </li>
                    ) : null
                  )}
                </ul>
              ) : (
                <p
                  className="text-muted text-center"
                  style={{
                    fontSize: "0.9rem", // Smaller font size
                    fontStyle: "italic",
                    color: "#7f8c8d",
                  }}
                >
                  No pending invitations.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default UserDashboard;