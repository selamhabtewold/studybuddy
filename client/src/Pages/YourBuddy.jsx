import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { io } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";

const YourBuddy = () => {
  const [studyGroups, setStudyGroups] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [joinedGroups, setJoinedGroups] = useState([]); // State for joined groups
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up Socket.IO connection
    const newSocket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      cors: {
        origin: "http://localhost:3000",
        credentials: true,
      },
    });
    setSocket(newSocket);

    // Fetch user details to set userId, userName, and joinedGroups
    const token = localStorage.getItem("authToken");
    if (token) {
      fetch("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch user details");
          return res.json();
        })
        .then((data) => {
          setUserId(data._id);
          setUserName(data.name || "Anonymous");
          setJoinedGroups(data.joinedGroups || []); // Set joined groups from database
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          setError("Failed to fetch user details. Please log in again.");
        });
    }

    // Fetch study groups
    fetchStudyGroups();

    // Handle Socket.IO events
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    newSocket.on("groupUpdated", (updatedGroup) => {
      console.log("Group updated:", updatedGroup);
      setStudyGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === updatedGroup._id
            ? { ...group, membersCount: updatedGroup.membersCount || 0, members: updatedGroup.members || [] }
            : group
        )
      );
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
      setError(`Connection failed: ${err.message}. Please check if the server is running at http://localhost:5000.`);
    });

    newSocket.on("error", (errorData) => {
      if (errorData.message === "You are already a member of this group") {
        console.log("User already a member, no action needed on client.");
      } else {
        console.error("Socket error:", errorData.message);
        setError(`Socket error: ${errorData.message}`);
      }
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const fetchStudyGroups = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch("http://localhost:5000/api/study-groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch study groups");
      const data = await response.json();
      console.log("Fetched study groups:", data);
      setStudyGroups(data.map(group => ({
        ...group,
        members: group.members || [],
        membersCount: group.membersCount || 0,
      })));
    } catch (err) {
      console.error("Error fetching study groups:", err);
      setError("Failed to load study groups. Please try again later.");
    }
  };

  const handleJoinGroup = async (groupId) => {
    console.log("Attempting to join group with ID:", groupId, "User ID:", userId);
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You must be logged in to join a group.");
      navigate("/login");
      return;
    }

    if (!userId) {
      alert("User ID not found. Please log in again.");
      return;
    }

    const group = studyGroups.find(g => g._id === groupId);
    if (isUserMember(group)) {
      alert("You are already a member of this group!");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/study-groups/join/${groupId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();
      console.log("Join response:", data);

      if (!response.ok) {
        if (response.status === 400 && data.message === "You are already a member of this group") {
          alert("You are already a member of this group!");
        } else {
          throw new Error(data.message || `Server error: ${response.status} ${response.statusText}`);
        }
        return;
      }

      // Update local state with the new member data
      const { group } = data;
      setStudyGroups((prevGroups) =>
        prevGroups.map((g) =>
          g._id === groupId
            ? { ...g, members: group.members || [], membersCount: group.membersCount || 0 }
            : g
        )
      );
      setJoinedGroups([...joinedGroups, { _id: groupId, name: group.name }]); // Update joinedGroups state

      if (socket) {
        socket.emit("joinGroup", { userId, groupId });
      }
      alert("Successfully joined the group!");
      
      // Redirect to the group chat window after joining
      const groupData = studyGroups.find(g => g._id === groupId) || group;
      navigate(`/groupchat/${groupId}`, { state: { groupName: groupData.name, userId, userName } });
    } catch (error) {
      console.error("Error joining study group:", error);
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
        body: JSON.stringify({ userId }) // Use the userId from state
      });
      const data = await response.json();
      if (response.ok) {
        // Update local state
        setStudyGroups((prevGroups) =>
          prevGroups.map((g) =>
            g._id === groupId
              ? { ...g, members: g.members.filter(id => id.toString() !== userId.toString()), membersCount: g.members.length - 1 }
              : g
          )
        );
        setJoinedGroups(joinedGroups.filter(g => g._id.toString() !== groupId.toString()));
  
        if (socket) {
          socket.emit("leaveGroup", { userId, groupId });
        }
        alert("Left the group successfully!");
      } else {
        throw new Error(data.message || "Failed to leave group");
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const isUserMember = (group) => {
    if (!userId || !group?.members) return false;
    return Array.isArray(group.members) && group.members.includes(userId);
  };

  const handleOpenChat = (groupId) => {
    if (isUserMember(studyGroups.find(g => g._id === groupId))) {
      const group = studyGroups.find(g => g._id === groupId);
      if (group) {
        navigate(`/groupchat/${groupId}`, { state: { groupName: group.name, userId, userName } });
      }
    } else {
      alert("You must join the group before accessing the chat!");
    }
  };

  if (error) {
    return (
      <div
        className="text-danger text-center min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: "#1a1a1a", color: "#ff0000" }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center"
      style={{
        backgroundColor: "#1a1a1a", // Dark background from the image
        fontFamily: "'Arial', sans-serif",
        color: "#ffffff",
      }}
    >
      <h2 className="text-center mb-4 fw-bold">Connect With Your StudyBuddy ™</h2>
      <div className="mt-5 w-75 mx-auto" style={{ maxWidth: "1200px" }}>
        <h4 className="fw-bold mb-3">
          <span role="img" aria-label="groups">👥</span> Available Study Groups
        </h4>
        {studyGroups.length === 0 ? (
          <p className="text-center" style={{ color: "#aaaaaa" }}>
            No study groups available yet.
          </p>
        ) : (
          <div className="row mt-3">
            {studyGroups.map((group) => (
              <div key={group._id} className="col-md-4 mb-3">
                <div
                  className="text-center text-white p-3 rounded shadow-lg border"
                  style={{
                    backgroundColor: "#2d2d2d", // Dark background for cards
                    borderColor: "rgba(212, 38, 255, 0.2)", // Subtle purple border
                    borderRadius: "8px",
                    height: "250px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <img
                    src={group.image || "https://via.placeholder.com/150"} // Fallback image if none provided
                    alt={group.name}
                    className="rounded"
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                  <h5 className="fw-bold mt-2">{group.name} Group</h5>
                  <p className="mb-1" style={{ color: "#aaaaaa" }}>
                    Members: {group.membersCount || 0}
                  </p>
                  {isUserMember(group) ? (
                    <button
                      className="btn fw-bold px-3 py-1 shadow-sm"
                      style={{
                        backgroundColor: "#d426ff", // Purple for joined groups
                        color: "white",
                        borderRadius: "8px",
                        transition: "background 0.3s ease-in-out",
                        border: "none",
                        cursor: "pointer",
                        opacity: 1,
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#b31cff"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "#d426ff"}
                      onClick={() => handleOpenChat(group._id)}
                      title="Open the group chat"
                    >
                      Open Chat <span className="ms-1">➡️</span>
                    </button>
                  ) : (
                    <button
                      className="btn fw-bold px-3 py-1 shadow-sm"
                      style={{
                        backgroundColor: "#d426ff", // Purple for unjoined groups
                        color: "white",
                        borderRadius: "8px",
                        transition: "background 0.3s ease-in-out",
                        border: "none",
                        cursor: "pointer",
                        opacity: 1,
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#b31cff"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "#d426ff"}
                      onClick={() => handleJoinGroup(group._id)}
                      title="Join this group"
                    >
                      Join now <span className="ms-1">➡️</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <h4 className="fw-bold mt-5 mb-3">
        <span role="img" aria-label="groups">👥</span> Joined Study Groups
      </h4>
      {joinedGroups.length === 0 ? (
        <p className="text-center" style={{ color: "#aaaaaa" }}>
          You haven't joined any study groups yet.
        </p>
      ) : (
        <div className="row mt-3 w-75 mx-auto" style={{ maxWidth: "1200px" }}>
          {joinedGroups.map((group) => (
            <div key={group._id} className="col-md-4 mb-3">
              <div
                className="text-center text-white p-3 rounded shadow-lg border"
                style={{
                  backgroundColor: "#2d2d2d", // Dark background for cards
                  borderColor: "rgba(212, 38, 255, 0.2)", // Subtle purple border
                  borderRadius: "8px",
                  height: "250px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                <h5 className="fw-bold mt-2">{group.name} Group</h5>
                <div className="d-flex gap-2 mt-2">
                  <button
                    className="btn fw-bold px-3 py-1 shadow-sm"
                    style={{
                      backgroundColor: "#f1c40f", // Yellow for Leave
                      color: "#000000",
                      borderRadius: "8px",
                      transition: "background 0.3s ease-in-out",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#e3b50a"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#f1c40f"}
                    onClick={() => handleLeaveGroup(group._id)}
                    title="Leave this group"
                  >
                    Leave
                  </button>
                  <button
                    className="btn fw-bold px-3 py-1 shadow-sm"
                    style={{
                      backgroundColor: "#9C27B0", // Purple for Group Chat
                      color: "#ffffff",
                      borderRadius: "8px",
                      transition: "background 0.3s ease-in-out",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#8b1ea6"}
                    onMouseOut={(e) => e.target.style.backgroundColor = "#9C27B0"}
                    onClick={() => handleOpenChat(group._id)}
                    title="Open the group chat"
                  >
                    Group Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YourBuddy;