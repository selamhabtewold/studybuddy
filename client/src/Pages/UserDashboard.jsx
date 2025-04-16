

// // export default UserDashboard;
// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { io } from "socket.io-client";
// import { useOnlineUsers } from "/src/context/OnlineUsersContext";
// import Picker from "emoji-picker-react";
// import { Mic, Paperclip, X } from "react-feather";
// import axios from "axios";

// // Modal Component
// const Modal = ({ isOpen, onClose, fileUrl, fileName, isImage }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="modal" style={{
//       position: "fixed",
//       top: 0,
//       left: 0,
//       right: 0,
//       bottom: 0,
//       backgroundColor: "rgba(0,0,0,0.8)",
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       zIndex: 1000,
//     }}>
//       <div style={{
//         backgroundColor: "#2b2e3c",
//         padding: "20px",
//         borderRadius: "10px",
//         position: "relative",
//         maxWidth: "90%",
//         maxHeight: "90vh",
//         overflow: "auto",
//       }}>
//         <button
//           onClick={onClose}
//           style={{
//             position: "absolute",
//             top: "10px",
//             right: "10px",
//             background: "none",
//             border: "none",
//             color: "#ffffff",
//             cursor: "pointer",
//           }}
//         >
//           <X size={20} />
//         </button>
//         {isImage ? (
//           <img src={fileUrl} alt={fileName} style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "5px" }} />
//         ) : (
//           <div>
//             <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer" style={{ color: "#9C27B0", textDecoration: "none" }}>
//               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
//                 <polyline points="14 2 14 8 20 8"/>
//                 <line x1="16" y1="13" x2="8" y2="13"/>
//                 <line x1="16" y1="17" x2="8" y2="17"/>
//                 <polyline points="10 9 9 9 8 9"/>
//               </svg>
//               <p style={{ color: "#ffffff", marginTop: "10px" }}>{fileName}</p>
//             </a>
//             <p style={{ color: "#aaaaaa", marginTop: "5px" }}>Click to download</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // ErrorBoundary Component (unchanged)
// class ErrorBoundary extends React.Component {
//   state = { hasError: false, error: null };

//   static getDerivedStateFromError(error) {
//     return { hasError: true, error };
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#1a1d26", color: "#ff4444" }}>
//           <div className="text-center">
//             <p>Error: {this.state.error.message || "An unexpected error occurred."}</p>
//             <button className="btn btn-purple mt-2" onClick={() => window.location.reload()}>
//               Retry
//             </button>
//           </div>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// const UserDashboard = () => {
//   const [user, setUser] = useState(null);
//   const [editMode, setEditMode] = useState(false);
//   const [formData, setFormData] = useState({ name: "", email: "" });
//   const [onlineUsers, setOnlineUsers] = useState({});
//   const [classroomForm, setClassroomForm] = useState({
//     name: "",
//     selectedUsers: [],
//     isPublic: false,
//     duration: 60,
//     scheduledStartTime: new Date().toISOString().slice(0, 16),
//   });
//   const [invitations, setInvitations] = useState([]);
//   const [createdClassrooms, setCreatedClassrooms] = useState([]);
//   const [socket, setSocket] = useState(null);
//   const [error, setError] = useState(null);
//   const [activeSection, setActiveSection] = useState("userInfo");
//   const [waitingForHost, setWaitingForHost] = useState(null);
//   const [availableGroups, setAvailableGroups] = useState([]);
//   const [selectedChatGroup, setSelectedChatGroup] = useState(null);
//   const [chatMessages, setChatMessages] = useState({});
//   const [chatMessage, setChatMessage] = useState("");
//   const [isTyping, setIsTyping] = useState({});
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioBlob, setAudioBlob] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalFileUrl, setModalFileUrl] = useState("");
//   const [modalFileName, setModalFileName] = useState("");
//   const [isModalImage, setIsModalImage] = useState(false);
//   const messagesEndRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const jitsiContainerRef = useRef(null);
//   const jitsiApiRef = useRef(null);
//   const navigate = useNavigate();
//   const { setOnlineUsersCount } = useOnlineUsers();

//   // Fetch chat history from the database
//   const fetchChatHistory = async (groupId) => {
//     if (!groupId || !user) return;
//     try {
//       const token = localStorage.getItem("authToken");
//       const response = await axios.get(`http://localhost:5000/api/study-groups/${groupId}/messages`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setChatMessages((prev) => ({
//         ...prev,
//         [groupId]: response.data.messages || [],
//       }));
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     } catch (error) {
//       console.error("Error fetching chat history:", error);
//       setError(`Failed to load chat history: ${error.message}`);
//     }
//   };

//   // Fetch other data (unchanged except for fetchCreatedClassrooms)
//   const fetchCreatedClassrooms = async () => {
//     const token = localStorage.getItem("authToken");
//     if (!token || !user) return;
//     try {
//       const response = await fetch(`http://localhost:5000/api/classrooms?creator=${user._id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) {
//         if (response.status === 404) {
//           setCreatedClassrooms([]);
//           return;
//         }
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       setCreatedClassrooms(data);
//     } catch (error) {
//       console.error("Error fetching classrooms:", error);
//       setError(error.message);
//     }
//   };

//   const fetchAvailableGroups = async () => {
//     const token = localStorage.getItem("authToken");
//     if (!token || !user) return;
//     try {
//       const response = await fetch("http://localhost:5000/api/study-groups", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!response.ok) throw new Error("Failed to fetch available groups");
//       const data = await response.json();
//       setAvailableGroups(data.filter(group => !user.joinedGroups.some(g => g._id === group._id)));
//     } catch (error) {
//       console.error("Error fetching available groups:", error);
//       setError(error.message);
//     }
//   };

//   useEffect(() => {
//     let mounted = true;

//     const initializeSocket = () => {
//       const socketUrl = "http://localhost:5000"; // Ensure this matches your backend URL
//       const newSocket = io(socketUrl, {
//         reconnection: true,
//         reconnectionAttempts: 10,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         timeout: 20000,
//         transports: ["websocket", "polling"],
//         path: "/socket.io",
//         autoConnect: false,
//         withCredentials: true,
//       });

//       newSocket.on("connect", () => {
//         console.log("Connected to WebSocket with socket ID:", newSocket.id);
//         const token = localStorage.getItem("authToken");
//         if (token && mounted) {
//           fetch(`${socketUrl}/api/users/me`, {
//             headers: { Authorization: `Bearer ${token}` },
//           })
//             .then((res) => {
//               if (!res.ok) throw new Error("Failed to authenticate user");
//               return res.json();
//             })
//             .then((data) => {
//               if (mounted && data._id) {
//                 newSocket.emit("userLoggedIn", data._id.toString());
//                 if (selectedChatGroup) {
//                   newSocket.emit("joinGroupChat", { userId: data._id, groupId: selectedChatGroup });
//                   fetchChatHistory(selectedChatGroup);
//                 }
//               }
//             })
//             .catch((err) => {
//               console.error("Error fetching user for login:", err);
//               if (mounted) setError("Failed to authenticate with real-time updates.");
//             });
//         }
//       });

//       newSocket.on("onlineUsers", (usersByGroup) => {
//         if (mounted) {
//           setOnlineUsers(usersByGroup);
//           const uniqueUsers = new Set(
//             Object.values(usersByGroup).flatMap(group => group.map(user => user.userId))
//           );
//           setOnlineUsersCount(uniqueUsers.size);
//         }
//       });

//       newSocket.on("classroomInvite", ({ classroomId, creator, creatorName, classroomName, message }) => {
//         if (mounted && creator !== user?._id?.toString()) {
//           setInvitations((prev) => {
//             if (prev.some((inv) => inv.classroomId === classroomId)) return prev;
//             return [
//               ...prev,
//               { classroomId, creator, creatorName, classroomName, message, responded: false },
//             ];
//           });
//         }
//       });

//       newSocket.on("classroomStarted", ({ classroomId, roomName }) => {
//         if (mounted && waitingForHost === classroomId) {
//           joinJitsiMeeting(classroomId, roomName);
//           setWaitingForHost(null);
//         }
//         if (mounted) fetchCreatedClassrooms();
//       });

//       const joinJitsiMeeting = (classroomId, roomName) => {
//         if (jitsiApiRef.current) {
//           jitsiApiRef.current.dispose();
//         }
//         const options = {
//           roomName,
//           width: "100%",
//           height: "100%",
//           parentNode: jitsiContainerRef.current,
//           userInfo: {
//             displayName: user.name,
//             email: user.email,
//           },
//         };
//         jitsiApiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", options);
//       };

//       newSocket.on("classroomUpdated", () => {
//         if (mounted) fetchCreatedClassrooms();
//       });

//       newSocket.on("classroomEnded", ({ classroomId }) => {
//         if (mounted) {
//           setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
//           setWaitingForHost(null);
//           fetchCreatedClassrooms();
//           if (jitsiApiRef.current) {
//             jitsiApiRef.current.dispose();
//             jitsiApiRef.current = null;
//           }
//         }
//       });

//       newSocket.on("classroomDeleted", ({ classroomId }) => {
//         if (mounted) {
//           setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
//           setWaitingForHost(null);
//           fetchCreatedClassrooms();
//           if (jitsiApiRef.current) {
//             jitsiApiRef.current.dispose();
//             jitsiApiRef.current = null;
//           }
//         }
//       });

//       newSocket.on("clearInvitation", ({ classroomId }) => {
//         if (mounted) {
//           setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
//         }
//       });

//       newSocket.on("receiveGroupMessage", (messageData) => {
//         if (mounted && messageData.groupId === selectedChatGroup) {
//           setChatMessages((prev) => ({
//             ...prev,
//             [messageData.groupId]: [
//               ...(prev[messageData.groupId] || []),
//               messageData,
//             ].filter((msg, index, self) =>
//               index === self.findIndex(m => m.messageId === msg.messageId)
//             ),
//           }));
//           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//         }
//       });

//       newSocket.on("typing", ({ userId: typingUserId, groupId: typingGroupId }) => {
//         if (mounted && typingGroupId === selectedChatGroup && typingUserId !== user?._id) {
//           setIsTyping((prev) => ({ ...prev, [typingUserId]: true }));
//           setTimeout(() => setIsTyping((prev) => ({ ...prev, [typingUserId]: false })), 2000);
//         }
//       });

//       newSocket.on("connect_error", (err) => {
//         console.error("Socket.IO connection error:", err.message);
//         if (mounted) setError(`WebSocket connection failed: ${err.message}. Retrying...`);
//       });

//       newSocket.on("disconnect", (reason) => {
//         console.log("Disconnected from WebSocket:", reason);
//         if (mounted && reason !== "io client disconnect") {
//           setError(`Disconnected from real-time updates: ${reason}. Attempting to reconnect...`);
//         }
//       });

//       newSocket.connect();
//       setSocket(newSocket);
//       return newSocket;
//     };

//     const fetchUserDetails = async () => {
//       const token = localStorage.getItem("authToken");
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       try {
//         const response = await fetch("http://localhost:5000/api/users/me", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await response.json();
//         if (!mounted) return;
//         if (response.ok) {
//           setUser(data);
//           setFormData({ name: data.name, email: data.email });
//           fetchCreatedClassrooms();
//         } else {
//           throw new Error(data.message || "Failed to fetch user details");
//         }
//       } catch (error) {
//         console.error("Error fetching user:", error);
//         if (mounted) {
//           setError(error.message || "Failed to load user details");
//           navigate("/login");
//         }
//       }
//     };

//     fetchUserDetails();
//     const socketInstance = initializeSocket();

//     return () => {
//       mounted = false;
//       if (socketInstance) {
//         socketInstance.disconnect();
//       }
//       if (jitsiApiRef.current) {
//         jitsiApiRef.current.dispose();
//         jitsiApiRef.current = null;
//       }
//     };
//   }, [navigate, selectedChatGroup]);

//   useEffect(() => {
//     if (user) fetchAvailableGroups();
//   }, [user]);

//   // Jitsi Meeting Functions (unchanged)
//   const startJitsiMeeting = (classroomId) => {
//     if (jitsiApiRef.current) {
//       jitsiApiRef.current.dispose();
//     }
//     const roomName = `Classroom-${classroomId}-${Date.now()}`;
//     const options = {
//       roomName,
//       width: "100%",
//       height: "100%",
//       parentNode: jitsiContainerRef.current,
//       userInfo: {
//         displayName: user.name,
//         email: user.email,
//       },
//       interfaceConfigOverwrite: {
//         TOOLBAR_BUTTONS: [
//           "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
//           "fodeviceselection", "hangup", "profile", "chat", "recording",
//           "livestreaming", "etherpad", "sharedvideo", "settings", "raisehand",
//           "videoquality", "filmstrip", "invite", "feedback", "stats", "shortcuts",
//           "tileview", "videobackgroundblur", "download", "help", "mute-everyone",
//         ],
//       },
//     };
//     jitsiApiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", options);
//     jitsiApiRef.current.addEventListener("videoConferenceJoined", () => {
//       console.log("Host joined the meeting");
//     });
//     jitsiApiRef.current.addEventListener("readyToClose", () => {
//       jitsiApiRef.current.dispose();
//       jitsiApiRef.current = null;
//       setActiveSection("createdClassrooms");
//     });
//     setActiveSection("videoMeeting");
//   };

//   const joinJitsiMeeting = (classroomId) => {
//     if (jitsiApiRef.current) {
//       jitsiApiRef.current.dispose();
//     }
//     const roomName = `Classroom-${classroomId}-${Date.now()}`;
//     const options = {
//       roomName,
//       width: "100%",
//       height: "100%",
//       parentNode: jitsiContainerRef.current,
//       userInfo: {
//         displayName: user.name,
//         email: user.email,
//       },
//     };
//     jitsiApiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", options);
//     jitsiApiRef.current.addEventListener("videoConferenceJoined", () => {
//       console.log("Participant joined the meeting");
//     });
//     jitsiApiRef.current.addEventListener("readyToClose", () => {
//       jitsiApiRef.current.dispose();
//       jitsiApiRef.current = null;
//       setActiveSection("invitations");
//     });
//     setActiveSection("videoMeeting");
//   };

//   const handleStartSession = async (classroomId) => {
//     const token = localStorage.getItem("authToken");
//     try {
//       const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}/start`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         socket.emit("classroomStarted", { classroomId });
//         startJitsiMeeting(classroomId);
//         fetchCreatedClassrooms();
//       } else {
//         throw new Error(data.message || "Failed to start session");
//       }
//     } catch (error) {
//       console.error("Error starting session:", error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   // Other handlers (unchanged except where noted)
//   const handleJoinGroup = async (groupId) => {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       alert("You must be logged in to join a group.");
//       navigate("/login");
//       return;
//     }
//     try {
//       const response = await fetch(`http://localhost:5000/api/study-groups/join/${groupId}`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ userId: user._id }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         const joinedGroup = data.group || { _id: groupId, name: "Unnamed Group" };
//         setUser({
//           ...user,
//           joinedGroups: [...user.joinedGroups, { ...joinedGroup, name: joinedGroup.name || "Unnamed Group" }],
//         });
//         setAvailableGroups(availableGroups.filter(g => g._id !== groupId));
//         alert("Joined the group successfully!");
//       } else {
//         throw new Error(data.message || "Failed to join group");
//       }
//     } catch (error) {
//       console.error("Error joining group:", error);
//       alert(`Error joining group: ${error.message}`);
//     }
//   };

//   const handleCreateClassroom = async (e) => {
//     e.preventDefault();
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       alert("You must be logged in to create a classroom.");
//       navigate("/login");
//       return;
//     }

//     const payload = {
//       name: classroomForm.name,
//       isPublic: classroomForm.isPublic,
//       selectedUsers: classroomForm.selectedUsers.filter((id) => id !== user._id?.toString()),
//       duration: classroomForm.duration,
//       scheduledStartTime: classroomForm.scheduledStartTime,
//       creator: user._id?.toString(),
//     };

//     try {
//       const response = await fetch("http://localhost:5000/api/classrooms", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         const classroomId = data._id || data.classroomId;
//         socket.emit("notifyClassroom", {
//           classroomId,
//           users: payload.selectedUsers,
//           creatorName: user.name,
//           classroomName: payload.name,
//           startTime: payload.scheduledStartTime,
//         });
//         alert("Classroom created and invitations sent!");
//         setClassroomForm({
//           name: "",
//           selectedUsers: [],
//           isPublic: false,
//           duration: 60,
//           scheduledStartTime: new Date().toISOString().slice(0, 16),
//         });
//         fetchCreatedClassrooms();
//       } else {
//         throw new Error(data.message || `Server error: ${response.status}`);
//       }
//     } catch (error) {
//       console.error("Error creating classroom:", error);
//       alert(`Error creating classroom: ${error.message}`);
//     }
//   };

//   const handleInvitationResponse = (classroomId, response) => {
//     if (socket) {
//       socket.emit("classroomResponse", { classroomId, userId: user._id?.toString(), response });
//       setInvitations((prev) =>
//         prev.map((inv) =>
//           inv.classroomId === classroomId ? { ...inv, responded: true } : inv
//         )
//       );
//       if (response === "accept") {
//         setWaitingForHost(classroomId);
//       }
//     }
//   };

//   const handleLogout = () => {
//     if (socket) socket.disconnect();
//     if (jitsiApiRef.current) {
//       jitsiApiRef.current.dispose();
//       jitsiApiRef.current = null;
//     }
//     localStorage.removeItem("authToken");
//     setUser(null);
//     navigate("/login");
//   };

//   const handleUpdateUser = async (e) => {
//     e.preventDefault();
//     const token = localStorage.getItem("authToken");
//     try {
//       const response = await fetch("http://localhost:5000/api/users/me", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(formData),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setUser({ ...user, ...formData });
//         setEditMode(false);
//         alert("User information updated!");
//       } else {
//         throw new Error(data.message || "Failed to update user");
//       }
//     } catch (error) {
//       console.error("Error updating user:", error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   const handleLeaveGroup = async (groupId) => {
//     const token = localStorage.getItem("authToken");
//     try {
//       const response = await fetch(`http://localhost:5000/api/study-groups/leave/${groupId}`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ userId: user._id }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setUser({
//           ...user,
//           joinedGroups: user.joinedGroups.filter((g) => g._id.toString() !== groupId.toString()),
//         });
//         fetchAvailableGroups();
//         alert("Left the group successfully!");
//         if (socket) {
//           socket.emit("leaveGroup", { userId: user._id, groupId });
//         }
//       } else {
//         throw new Error(data.message || "Failed to leave group");
//       }
//     } catch (error) {
//       console.error("Error leaving group:", error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   const handleSetDuration = async (classroomId, duration) => {
//     const token = localStorage.getItem("authToken");
//     try {
//       const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}/duration`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ duration }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         alert("Duration updated!");
//         fetchCreatedClassrooms();
//       } else {
//         throw new Error(data.message || "Failed to update duration");
//       }
//     } catch (error) {
//       console.error("Error setting duration:", error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   const handleEndSession = async (classroomId) => {
//     const token = localStorage.getItem("authToken");
//     try {
//       const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}/end`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         socket.emit("classroomEnded", { classroomId });
//         if (jitsiApiRef.current) {
//           jitsiApiRef.current.dispose();
//           jitsiApiRef.current = null;
//         }
//         alert("Session ended!");
//         fetchCreatedClassrooms();
//         setActiveSection("createdClassrooms");
//       } else {
//         throw new Error(data.message || "Failed to end session");
//       }
//     } catch (error) {
//       console.error("Error ending session:", error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   const handleDeleteSession = async (classroomId) => {
//     const token = localStorage.getItem("authToken");
//     try {
//       const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         socket.emit("classroomDeleted", { classroomId });
//         if (jitsiApiRef.current) {
//           jitsiApiRef.current.dispose();
//           jitsiApiRef.current = null;
//         }
//         alert("Classroom deleted!");
//         fetchCreatedClassrooms();
//       } else {
//         throw new Error(data.message || "Failed to delete classroom");
//       }
//     } catch (error) {
//       console.error("Error deleting session:", error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   const toggleUserSelection = (userId) => {
//     if (userId !== user._id?.toString()) {
//       setClassroomForm((prev) => ({
//         ...prev,
//         selectedUsers: prev.selectedUsers.includes(userId)
//           ? prev.selectedUsers.filter((id) => id !== userId)
//           : [...prev.selectedUsers, userId],
//       }));
//     }
//   };

//   const sendChatMessage = useCallback(async (e) => {
//     e.preventDefault();
//     if (!chatMessage.trim() && !audioBlob) return;

//     const messageData = {
//       userId: user._id,
//       groupId: selectedChatGroup,
//       userName: user.name,
//       timestamp: new Date().toISOString(),
//       messageId: `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//     };

//     const token = localStorage.getItem("authToken");

//     if (chatMessage.trim()) {
//       messageData.message = chatMessage.trim();
//       try {
//         await axios.post(
//           "http://localhost:5000/api/study-groups/messages",
//           messageData,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//       } catch (error) {
//         console.error("Error saving message to database:", error);
//         alert("Failed to save message to database.");
//         return;
//       }
//       socket?.emit("sendGroupMessage", messageData);
//     }

//     if (audioBlob) {
//       const formData = new FormData();
//       formData.append("audio", audioBlob, "voice-note.mp3");
//       formData.append("userId", user._id);
//       formData.append("groupId", selectedChatGroup);
//       formData.append("userName", user.name);

//       try {
//         const response = await axios.post(
//           "http://localhost:5000/api/study-groups/send-audio",
//           formData,
//           {
//             headers: {
//               "Content-Type": "multipart/form-data",
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//         const audioData = response.data;
//         messageData.audioUrl = audioData.audioUrl;
//         await axios.post(
//           "http://localhost:5000/api/study-groups/messages",
//           messageData,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//         socket?.emit("sendGroupMessage", messageData);
//       } catch (error) {
//         console.error("Error uploading voice note:", error);
//         alert("Failed to send voice note.");
//       }
//       setAudioBlob(null);
//     }

//     setChatMessage("");
//   }, [chatMessage, user, selectedChatGroup, socket, audioBlob]);

//   const handleChatTyping = useCallback(() => {
//     if (socket && chatMessage.length > 0 && user?._id && selectedChatGroup) {
//       socket.emit("typing", { userId: user._id, groupId: selectedChatGroup });
//     }
//   }, [socket, chatMessage, user, selectedChatGroup]);

//   const handleEmojiClick = (emojiObject) => {
//     setChatMessage((prev) => prev + emojiObject.emoji);
//     setShowEmojiPicker(false);
//   };

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream);
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
//       mediaRecorder.onstop = () => {
//         const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
//         setAudioBlob(audioBlob);
//         stream.getTracks().forEach((track) => track.stop());
//       };

//       mediaRecorder.start();
//       setIsRecording(true);
//     } catch (error) {
//       console.error("Error starting recording:", error);
//       alert("Failed to start recording.");
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//     }
//   };

//   const handleFileUpload = async (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("userId", user._id);
//       formData.append("groupId", selectedChatGroup);
//       formData.append("userName", user.name);
//       formData.append("fileName", file.name);

//       try {
//         const response = await axios.post(
//           "http://localhost:5000/api/study-groups/send-file",
//           formData,
//           {
//             headers: {
//               "Content-Type": "multipart/form-data",
//               Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//             },
//           }
//         );
//         const fileData = response.data;
//         const messageData = {
//           userId: user._id,
//           groupId: selectedChatGroup,
//           userName: user.name,
//           fileUrl: fileData.fileUrl,
//           fileName: file.name,
//           timestamp: new Date().toISOString(),
//           messageId: `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//         };
//         await axios.post(
//           "http://localhost:5000/api/study-groups/messages",
//           messageData,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//             },
//           }
//         );
//         socket?.emit("sendGroupMessage", messageData);
//       } catch (error) {
//         console.error("Error uploading file:", error);
//         alert("Failed to send file.");
//       }
//     }
//   };

//   const openModal = (fileUrl, fileName, isImage) => {
//     setModalFileUrl(fileUrl);
//     setModalFileName(fileName);
//     setIsModalImage(isImage);
//     setModalOpen(true);
//   };

//   // Updated getGroupMembers to prioritize active users
//   const getGroupMembers = () => {
//     if (!selectedChatGroup || !user?.joinedGroups) return [];
//     const group = user.joinedGroups.find(g => g._id === selectedChatGroup);
//     if (!group) return [];

//     console.log("Group data:", group); // Debug the group structure

//     // Handle both objects and raw IDs in members array
//     const members = group.members || [];
//     const onlineUsersInGroup = onlineUsers[selectedChatGroup] || [];

//     const memberList = members.map(member => {
//       let userId, name;
//       // If member is an object, extract _id and name
//       if (typeof member === 'object' && member !== null) {
//         userId = member._id || member.userId || member.id || null;
//         name = member.name || member.userName || member.username || "Unknown";
//       } 
//       // If member is a raw ID (string), use it as userId and fetch name if possible
//       else if (typeof member === 'string') {
//         userId = member;
//         const onlineUser = onlineUsersInGroup.find(u => u.userId === userId);
//         name = onlineUser ? onlineUser.name : `User ${userId.slice(-4)}`; // Fallback name
//       } else {
//         console.warn("Invalid member type:", member);
//         return null; // Skip invalid entries
//       }

//       if (!userId) {
//         console.warn("Member object missing userId:", member);
//         return null;
//       }

//       return {
//         userId,
//         name,
//         isActive: onlineUsersInGroup.some(u => u.userId === userId),
//       };
//     }).filter(member => member !== null) || [];

//     // Sort to place active users at the top
//     return [...memberList.filter(member => member.isActive), ...memberList.filter(member => !member.isActive)];
//   };

//   if (error) {
//     return (
//       <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#1a1d26", color: "#ff4444" }}>
//         <div className="text-center">
//           <p>Error: {error}</p>
//           <button className="btn btn-purple" onClick={() => window.location.reload()}>
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#1a1d26", color: "#ffffff" }}>
//         <div className="text-center">
//           <p>Loading user details...</p>
//           <div className="spinner-border text-purple" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <ErrorBoundary>
//       <div className="d-flex" style={{ minHeight: "90vh", backgroundColor: "#1a1d26" }}>
//         <nav className="sidebar bg-dark text-white p-2" style={{ width: "250px", position: "fixed", height: "100vh", backgroundColor: "#2b2e3c" }}>
//           <h3 className="mb-3 text-center" style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff" }}>
//             Study Buddy
//           </h3>
//           <ul className="nav flex-column">
//             {[
//               { name: "User Info", icon: "👤", section: "userInfo" },
//               { name: "Joined Groups", icon: "👥", section: "joinedGroups" },
//               { name: "Online Users", icon: "🌐", section: "onlineUsers" },
//               { name: "Create Classroom", icon: "📚", section: "createClassroom" },
//               { name: "Created Classrooms", icon: "🏫", section: "createdClassrooms" },
//               { name: "Invitations", icon: "✉️", section: "invitations" },
//             ].map((item) => (
//               <li key={item.section} className="nav-item mb-2">
//                 <button
//                   className={`btn w-100 text-left py-2 d-flex align-items-center ${activeSection === item.section ? "btn-purple" : ""}`}
//                   style={{
//                     fontSize: "0.9rem",
//                     fontWeight: "500",
//                     borderRadius: "6px",
//                     backgroundColor: activeSection === item.section ? "#9C27B0" : "transparent",
//                     border: "none",
//                     color: "#ffffff",
//                   }}
//                   onClick={() => {
//                     setActiveSection(item.section);
//                     if (item.section !== "groupChat" && activeSection === "videoMeeting" && jitsiApiRef.current) {
//                       jitsiApiRef.current.dispose();
//                       jitsiApiRef.current = null;
//                     }
//                     if (item.section !== "groupChat") setSelectedChatGroup(null);
//                   }}
//                 >
//                   <span className="me-2" style={{ fontSize: "1rem" }}>{item.icon}</span>
//                   {item.name}
//                 </button>
//               </li>
//             ))}
//             <li className="nav-item mb-2">
//               <button
//                 className="btn btn-danger w-100 py-2 d-flex align-items-center"
//                 onClick={handleLogout}
//               >
//                 <span className="me-2">🚪</span>Logout
//               </button>
//             </li>
//           </ul>
//         </nav>

//         <main className="flex-grow-1 p-3" style={{ marginLeft: "250px", backgroundColor: "#1a1d26" }}>
//           {activeSection === "userInfo" && (
//             <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
//               <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>User Information</h4>
//               {editMode ? (
//                 <form onSubmit={handleUpdateUser}>
//                   <div className="mb-2">
//                     <label htmlFor="nameInput" className="form-label" style={{ color: "#ffffff" }}>Name:</label>
//                     <input
//                       type="text"
//                       id="nameInput"
//                       className="form-control"
//                       value={formData.name}
//                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                       style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
//                     />
//                   </div>
//                   <div className="mb-2">
//                     <label htmlFor="emailInput" className="form-label" style={{ color: "#ffffff" }}>Email:</label>
//                     <input
//                       type="email"
//                       id="emailInput"
//                       className="form-control"
//                       value={formData.email}
//                       onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                       style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
//                     />
//                   </div>
//                   <div className="d-flex justify-content-between">
//                     <button type="submit" className="btn btn-purple">Save</button>
//                     <button type="button" className="btn btn-gray" onClick={() => setEditMode(false)}>Cancel</button>
//                   </div>
//                 </form>
//               ) : (
//                 <div className="text-center">
//                   <p style={{ color: "#ffffff" }}><strong>Email:</strong> {user.email}</p>
//                   <p style={{ color: "#ffffff" }}><strong>Role:</strong> {user.role}</p>
//                   <button className="btn btn-purple" onClick={() => setEditMode(true)}>Update Info</button>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeSection === "joinedGroups" && (
//             <div>
//               <div className="card p-2 mb-3" style={{ backgroundColor: "transparent", width: "100%", margin: "0 auto" }}>
//                 <h4 className="mb-3" style={{ color: "#9C27B0", fontSize: "1.2rem", fontWeight: "600" }}>Joined Study Groups</h4>
//                 <div className="d-flex flex-wrap gap-2 pb-2" style={{ justifyContent: "flex-start" }}>
//                   {user.joinedGroups && user.joinedGroups.length > 0 ? (
//                     user.joinedGroups.map((group) => (
//                       <div key={group._id} className="card flex-shrink-0" style={{ width: "160px", backgroundColor: "#2d2d2d" }}>
//                         <div className="card-body p-2 text-center">
//                           <div style={{ width: "60px", height: "60px", margin: "0 auto 10px", borderRadius: "10px", backgroundColor: "#ffffff" }}>
//                             <img
//                               src={group.image || "/default-group-icon.png"} // Local fallback image
//                               alt={`${group.name} icon`}
//                               onError={(e) => { e.target.src = "/default-group-icon.png"; }} // Fallback on error
//                               style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                             />
//                           </div>
//                           <h5 className="card-title mb-1" style={{ fontSize: "0.9rem", color: "#ffffff" }}>{group.name || "Unnamed Group"}</h5>
//                           <p className="mb-2" style={{ fontSize: "0.75rem", color: "#7f8c8d" }}>Free</p>
//                           <div className="d-flex flex-column gap-1">
//                             <button className="btn btn-warning w-100" onClick={() => handleLeaveGroup(group._id)}>Leave</button>
//                             <button className="btn btn-purple w-100" onClick={() => { setActiveSection("groupChat"); setSelectedChatGroup(group._id); socket?.emit("joinGroupChat", { userId: user._id, groupId: group._id }); }}>Chat</button>
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <p className="text-muted text-center w-100" style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>You haven't joined any study groups yet.</p>
//                   )}
//                 </div>
//               </div>
//               <div className="card p-2 mb-3" style={{ backgroundColor: "transparent", width: "100%", margin: "0 auto" }}>
//                 <h5 className="mb-3" style={{ color: "#9C27B0", fontSize: "1.2rem", fontWeight: "600" }}>Available Study Groups</h5>
//                 <div className="d-flex flex-wrap gap-2 pb-2" style={{ justifyContent: "flex-start" }}>
//                   {availableGroups.length > 0 ? (
//                     availableGroups.map((group) => (
//                       <div key={group._id} className="card flex-shrink-0" style={{ width: "160px", backgroundColor: "#2d2d2d" }}>
//                         <div className="card-body p-2 text-center">
//                           <div style={{ width: "60px", height: "60px", margin: "0 auto 10px", borderRadius: "10px", backgroundColor: "#ffffff" }}>
//                             <img
//                               src={group.image || "/default-group-icon.png"} // Local fallback image
//                               alt={`${group.name} icon`}
//                               onError={(e) => { e.target.src = "/default-group-icon.png"; }} // Fallback on error
//                               style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                             />
//                           </div>
//                           <h5 className="card-title mb-1" style={{ fontSize: "0.9rem", color: "#ffffff" }}>{group.name || "Unnamed Group"}</h5>
//                           <p className="mb-2" style={{ fontSize: "0.75rem", color: "#7f8c8d" }}>Free</p>
//                           <button className="btn btn-success w-100" onClick={() => handleJoinGroup(group._id)}>Join</button>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <p className="text-muted text-center w-100" style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>No available study groups to join.</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeSection === "onlineUsers" && (
//             <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
//               <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Online Users in Your Groups</h4>
//               {user.joinedGroups && user.joinedGroups.length > 0 ? (
//                 user.joinedGroups.map((group) => (
//                   <div key={group._id} className="mb-3">
//                     <h5 className="mb-2" style={{ color: "#9C27B0" }}>{group.name}</h5>
//                     <ul className="list-group">
//                       {(onlineUsers[group._id] || []).length > 0 ? (
//                         onlineUsers[group._id].map(({ userId, name }) => (
//                           <li key={userId} className="list-group-item d-flex justify-content-between align-items-center py-1" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
//                             <span>{user._id?.toString() === userId ? `${name}(me)` : name}</span>
//                             <input
//                               type="checkbox"
//                               checked={classroomForm.selectedUsers.includes(userId)}
//                               onChange={() => toggleUserSelection(userId)}
//                               disabled={userId === user._id?.toString()}
//                             />
//                           </li>
//                         ))
//                       ) : (
//                         <p className="text-muted" style={{ color: "#7f8c8d" }}>No online users in this group.</p>
//                       )}
//                     </ul>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-muted text-center" style={{ color: "#7f8c8d" }}>Join a group to see online users.</p>
//               )}
//             </div>
//           )}

//           {activeSection === "createClassroom" && (
//             <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
//               <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Create a Classroom</h4>
//               <form onSubmit={handleCreateClassroom}>
//                 <div className="mb-2">
//                   <label htmlFor="classroomName" className="form-label" style={{ color: "#ffffff" }}>Classroom Name:</label>
//                   <input
//                     type="text"
//                     id="classroomName"
//                     className="form-control"
//                     value={classroomForm.name}
//                     onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
//                     required
//                     style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label htmlFor="duration" className="form-label" style={{ color: "#ffffff" }}>Duration (minutes):</label>
//                   <input
//                     type="number"
//                     id="duration"
//                     className="form-control"
//                     value={classroomForm.duration}
//                     onChange={(e) => setClassroomForm({ ...classroomForm, duration: parseInt(e.target.value) || 60 })}
//                     min="1"
//                     required
//                     style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label htmlFor="startTime" className="form-label" style={{ color: "#ffffff" }}>Scheduled Start Time:</label>
//                   <input
//                     type="datetime-local"
//                     id="startTime"
//                     className="form-control"
//                     value={classroomForm.scheduledStartTime}
//                     onChange={(e) => setClassroomForm({ ...classroomForm, scheduledStartTime: e.target.value })}
//                     required
//                     style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
//                   />
//                 </div>
//                 <div className="mb-2">
//                   <label className="form-label" style={{ color: "#ffffff" }}>Access:</label>
//                   <select
//                     className="form-control"
//                     value={classroomForm.isPublic}
//                     onChange={(e) => setClassroomForm({ ...classroomForm, isPublic: e.target.value === "true" })}
//                     disabled
//                     style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
//                   >
//                     <option value="false">Private (Selected users only)</option>
//                   </select>
//                 </div>
//                 <div className="mb-3">
//                   <label className="form-label" style={{ color: "#ffffff" }}>Select Users to Invite:</label>
//                   <ul className="list-group">
//                     {Object.entries(onlineUsers)
//                       .flatMap(([, users]) => users)
//                       .filter((user, index, self) => index === self.findIndex((u) => u.userId === user.userId))
//                       .map(({ userId, name }) => (
//                         <li key={userId} className="list-group-item d-flex justify-content-between align-items-center py-1" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
//                           <label className="form-check-label d-flex align-items-center w-100">
//                             <input
//                               type="checkbox"
//                               className="form-check-input me-1"
//                               checked={classroomForm.selectedUsers.includes(userId)}
//                               onChange={() => toggleUserSelection(userId)}
//                               disabled={userId === user._id?.toString()}
//                             />
//                             {name} {userId === user._id?.toString() ? "(me)" : ""}
//                           </label>
//                         </li>
//                       ))}
//                   </ul>
//                 </div>
//                 <button type="submit" className="btn btn-purple w-100">Create Classroom & Send Invites</button>
//               </form>
//             </div>
//           )}

//           {activeSection === "createdClassrooms" && (
//             <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
//               <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Your Created Classrooms</h4>
//               {createdClassrooms.length > 0 ? (
//                 <ul className="list-group">
//                   {createdClassrooms.map((classroom) => (
//                     <li key={classroom._id} className="list-group-item py-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
//                       <div>
//                         {classroom.name} - 
//                         <span style={{ color: classroom.isActive ? "#9C27B0" : "#7f8c8d" }}>
//                           {classroom.isActive ? "Active" : "Scheduled/Inactive"}
//                         </span> -
//                         Starts: {new Date(classroom.scheduledStartTime).toLocaleString()} -
//                         Duration: {classroom.duration} minutes
//                       </div>
//                       <div className="mt-2 d-flex justify-content-between flex-wrap gap-1">
//                         <button
//                           className="btn btn-blue btn-sm"
//                           onClick={() => handleSetDuration(classroom._id, prompt("New duration (minutes):", classroom.duration) || classroom.duration)}
//                           disabled={classroom.isActive}
//                         >
//                           Update Duration
//                         </button>
//                         <button
//                           className="btn btn-purple btn-sm"
//                           onClick={() => handleStartSession(classroom._id)}
//                           disabled={classroom.isActive || new Date() < new Date(classroom.scheduledStartTime)}
//                         >
//                           Start Session
//                         </button>
//                         <button
//                           className="btn btn-yellow btn-sm"
//                           onClick={() => handleEndSession(classroom._id)}
//                           disabled={!classroom.isActive}
//                         >
//                           End Session
//                         </button>
//                         <button
//                           className="btn btn-danger btn-sm"
//                           onClick={() => handleDeleteSession(classroom._id)}
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-muted text-center" style={{ color: "#7f8c8d" }}>You haven’t created any classrooms yet.</p>
//               )}
//             </div>
//           )}

//           {activeSection === "invitations" && (
//             <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
//               <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Pending Invitations</h4>
//               {invitations.length > 0 ? (
//                 <ul className="list-group">
//                   {invitations.map((inv, index) =>
//                     !inv.responded ? (
//                       <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
//                         <span>{inv.message}</span>
//                         <div>
//                           <button className="btn btn-blue btn-sm me-2" onClick={() => handleInvitationResponse(inv.classroomId, "accept")}>
//                             Accept
//                           </button>
//                           <button className="btn btn-gray btn-sm" onClick={() => handleInvitationResponse(inv.classroomId, "decline")}>
//                             Decline
//                           </button>
//                         </div>
//                       </li>
//                     ) : waitingForHost === inv.classroomId ? (
//                       <li key={index} className="list-group-item text-center py-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
//                         Waiting for host to start the meeting for "{inv.classroomName}"...
//                         <div className="spinner-border text-purple mt-1" role="status">
//                           <span className="visually-hidden">Loading...</span>
//                         </div>
//                       </li>
//                     ) : null
//                   )}
//                 </ul>
//               ) : (
//                 <p className="text-muted text-center" style={{ color: "#7f8c8d" }}>No pending invitations.</p>
//               )}
//             </div>
//           )}

//           {activeSection === "groupChat" && selectedChatGroup && (
//             <div className="d-flex" style={{ position: "relative", height: "calc(100vh - 100px)" }}>
//               <div className="card p-3 flex-grow-1" style={{ backgroundColor: "#2b2e3c", maxWidth: "calc(100% - 300px)", marginRight: "10px", position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
//                 <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>
//                   {user.joinedGroups.find(g => g._id === selectedChatGroup)?.name || "Group Chat"}
//                 </h4>
//                 {Object.entries(isTyping).some(([_, typing]) => typing) && (
//                   <p className="text-muted text-center" style={{ color: "#7f8c8d" }}>Someone is typing...</p>
//                 )}
//                 <div className="mb-3 p-3 flex-grow-1" style={{ backgroundColor: "#3c3f4c", overflowY: "auto", maxHeight: "calc(100% - 100px)", scrollbarWidth: "none", msOverflowStyle: "none" }}>
//                   <style>{`.mb-3::-webkit-scrollbar { display: none; }`}</style>
//                   {(chatMessages[selectedChatGroup] || []).map((msg, index) => (
//                     <div key={index} className={`mb-2 ${msg.userId === user._id ? "text-end" : "text-start"}`}>
//                       <span className={`d-inline-block p-2 rounded-lg ${msg.userId === user._id ? "bg-purple-600" : "bg-gray-700"}`} style={{ maxWidth: "75%", color: "#ffffff" }}>
//                         <strong>{msg.userName || "Member"}</strong>
//                         {msg.message && `: ${msg.message}`}
//                         {msg.audioUrl && <audio controls src={msg.audioUrl} />}
//                         {msg.fileUrl && (
//                           <div className="mt-1" onClick={() => openModal(msg.fileUrl, msg.fileName, msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/))}>
//                             {msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/) ? (
//                               <img src={msg.fileUrl} alt={msg.fileName || "File"} style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "5px", cursor: "pointer" }} />
//                             ) : (
//                               <span className="d-flex align-items-center" style={{ cursor: "pointer" }}>
//                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                   <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
//                                   <polyline points="14 2 14 8 20 8"/>
//                                   <line x1="16" y1="13" x2="8" y2="13"/>
//                                   <line x1="16" y1="17" x2="8" y2="17"/>
//                                   <polyline points="10 9 9 9 8 9"/>
//                                 </svg>
//                                 {msg.fileName || "File"}
//                               </span>
//                             )}
//                           </div>
//                         )}
//                         <br />
//                         <small style={{ color: "#aaaaaa" }}>
//                           {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                         </small>
//                       </span>
//                     </div>
//                   ))}
//                   <div ref={messagesEndRef} />
//                 </div>
//                 <form onSubmit={sendChatMessage} className="d-flex gap-2 align-items-center p-2" style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#2b2e3c" }}>
//                   <input
//                     type="text"
//                     value={chatMessage}
//                     onChange={(e) => {
//                       setChatMessage(e.target.value);
//                       handleChatTyping();
//                     }}
//                     placeholder="Type a message..."
//                     className="form-control flex-grow-1"
//                     style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
//                   />
//                   <button type="button" className="btn p-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
//                     😊
//                   </button>
//                   <label className="btn p-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
//                     <Paperclip size={20} />
//                     <input
//                       type="file"
//                       className="d-none"
//                       onChange={handleFileUpload}
//                       accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//                     />
//                   </label>
//                   <button
//                     type="button"
//                     className="btn p-2"
//                     style={{ backgroundColor: isRecording ? "#ff4444" : "#3c3f4c", color: "#ffffff" }}
//                     onClick={isRecording ? stopRecording : startRecording}
//                   >
//                     <Mic size={20} />
//                   </button>
//                   <button type="submit" className="btn btn-purple">Send</button>
//                 </form>
//                 {showEmojiPicker && (
//                   <div style={{ position: "absolute", bottom: "60px", right: "20px", zIndex: 1000 }}>
//                     <Picker onEmojiClick={handleEmojiClick} />
//                   </div>
//                 )}
//                 <Modal
//                   isOpen={modalOpen}
//                   onClose={() => setModalOpen(false)}
//                   fileUrl={modalFileUrl}
//                   fileName={modalFileName}
//                   isImage={isModalImage}
//                 />
//               </div>

//               {/* Right Sidebar */}
//               <aside className="sidebar bg-dark text-white p-2" style={{ width: "300px", position: "fixed", right: 0, height: "100vh", backgroundColor: "#2b2e3c", zIndex: 900 }}>
//                 <h5 className="mb-3 text-center" style={{ fontSize: "1rem", fontWeight: "600", color: "#9C27B0" }}>Group Members</h5>
//                 <ul className="list-group">
//                   {getGroupMembers().map((member) => (
//                     <li key={member.userId} className="list-group-item d-flex justify-content-between align-items-center py-1" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
//                       <span>{member.userId === user._id ? `${member.name} (me)` : member.name}</span>
//                       {member.isActive && <span style={{ color: "#00ff00", fontSize: "10px" }}>●</span>}
//                     </li>
//                   ))}
//                 </ul>
//               </aside>
//             </div>
//           )}

//           {activeSection === "videoMeeting" && (
//             <div className="card p-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "100%", margin: "0 auto", height: "80vh" }}>
//               <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Video Meeting</h4>
//               <div ref={jitsiContainerRef} style={{ width: "100%", height: "100%" }} />
//             </div>
//           )}
//         </main>
//       </div>
//       <style>
//         {`
//           .bg-purple-600 { background-color: #9C27B0 !important; }
//           .bg-gray-700 { background-color: #3c3f4c !important; }
//           .btn-purple { background-color: #9C27B0; border-color: #9C27B0; color: #ffffff; }
//           .btn-purple:hover { background-color: #7B1FA2; border-color: #7B1FA2; }
//           .btn-blue { background-color: #0288D1; border-color: #0288D1; color: #ffffff; }
//           .btn-blue:hover { background-color: #0277BD; border-color: #0277BD; }
//           .btn-yellow { background-color: #FBC02D; border-color: #FBC02D; color: #000000; }
//           .btn-yellow:hover { background-color: #F9A825; border-color: #F9A825; }
//           .btn-gray { background-color: #616161; border-color: #616161; color: #ffffff; }
//           .btn-gray:hover { background-color: #424242; border-color: #424242; }
//         `}
//       </style>
//     </ErrorBoundary>
//   );
// };

// export default UserDashboard;

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import { useOnlineUsers } from "/src/context/OnlineUsersContext";
import Picker from "emoji-picker-react";
import { Mic, Paperclip, X } from "react-feather";
import axios from "axios";

// Modal Component
const Modal = ({ isOpen, onClose, fileUrl, fileName, isImage }) => {
  if (!isOpen) return null;

  return (
    <div className="modal" style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: "#2b2e3c",
        padding: "20px",
        borderRadius: "10px",
        position: "relative",
        maxWidth: "90%",
        maxHeight: "90vh",
        overflow: "auto",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
        {isImage ? (
          <img src={fileUrl} alt={fileName} style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "5px" }} />
        ) : (
          <div>
            <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer" style={{ color: "#9C27B0", textDecoration: "none" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <p style={{ color: "#ffffff", marginTop: "10px" }}>{fileName}</p>
            </a>
            <p style={{ color: "#aaaaaa", marginTop: "5px" }}>Click to download</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ErrorBoundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#1a1d26", color: "#ff4444" }}>
          <div className="text-center">
            <p>Error: {this.state.error.message || "An unexpected error occurred."}</p>
            <button className="btn btn-purple mt-2" onClick={() => window.location.reload()}>
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
  const [selectedChatGroup, setSelectedChatGroup] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFileUrl, setModalFileUrl] = useState("");
  const [modalFileName, setModalFileName] = useState("");
  const [isModalImage, setIsModalImage] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const navigate = useNavigate();
  const { setOnlineUsersCount } = useOnlineUsers();

  // Fetch chat history
  const fetchChatHistory = async (groupId) => {
    if (!groupId || !user) return;
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`http://localhost:5000/api/study-groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatMessages((prev) => ({
        ...prev,
        [groupId]: response.data.messages || [],
      }));
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setError(`Failed to load chat history: ${error.message}`);
    }
  };

  // Fetch created classrooms
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
                if (selectedChatGroup) {
                  newSocket.emit("joinGroupChat", { userId: data._id, groupId: selectedChatGroup });
                  fetchChatHistory(selectedChatGroup);
                }
              }
            })
            .catch((err) => {
              console.error("Error fetching user for login:", err);
              if (mounted) setError("Failed to authenticate with real-time updates.");
            });
        }
      });

      newSocket.on("onlineUsers", (usersByGroup) => {
        if (mounted) {
          setOnlineUsers(usersByGroup);
          const uniqueUsers = new Set(
            Object.values(usersByGroup).flatMap(group => group.map(user => user.userId))
          );
          setOnlineUsersCount(uniqueUsers.size);
        }
      });

      newSocket.on("classroomInvite", ({ classroomId, creator, creatorName, classroomName, message, roomName }) => {
        if (mounted && creator !== user?._id?.toString()) {
          setInvitations((prev) => {
            if (prev.some((inv) => inv.classroomId === classroomId)) return prev;
            return [
              ...prev,
              { classroomId, creator, creatorName, classroomName, message, responded: false, roomName },
            ];
          });
        }
      });

      newSocket.on("classroomStarted", ({ classroomId, roomName }) => {
        if (mounted && waitingForHost === classroomId) {
          joinJitsiMeeting(classroomId, roomName);
          setWaitingForHost(null);
        }
        if (mounted) fetchCreatedClassrooms();
      });

      newSocket.on("classroomUpdated", () => {
        if (mounted) fetchCreatedClassrooms();
      });

      newSocket.on("classroomEnded", ({ classroomId }) => {
        if (mounted) {
          setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
          setWaitingForHost(null);
          fetchCreatedClassrooms();
          if (jitsiApiRef.current) {
            jitsiApiRef.current.dispose();
            jitsiApiRef.current = null;
          }
        }
      });

      newSocket.on("classroomDeleted", ({ classroomId }) => {
        if (mounted) {
          setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
          setWaitingForHost(null);
          fetchCreatedClassrooms();
          if (jitsiApiRef.current) {
            jitsiApiRef.current.dispose();
            jitsiApiRef.current = null;
          }
        }
      });

      newSocket.on("clearInvitation", ({ classroomId }) => {
        if (mounted) {
          setInvitations((prev) => prev.filter((inv) => inv.classroomId !== classroomId));
        }
      });

      newSocket.on("receiveGroupMessage", (messageData) => {
        if (mounted && messageData.groupId === selectedChatGroup) {
          setChatMessages((prev) => ({
            ...prev,
            [messageData.groupId]: [
              ...(prev[messageData.groupId] || []),
              messageData,
            ].filter((msg, index, self) =>
              index === self.findIndex(m => m.messageId === msg.messageId)
            ),
          }));
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      });

      newSocket.on("typing", ({ userId: typingUserId, groupId: typingGroupId }) => {
        if (mounted && typingGroupId === selectedChatGroup && typingUserId !== user?._id) {
          setIsTyping((prev) => ({ ...prev, [typingUserId]: true }));
          setTimeout(() => setIsTyping((prev) => ({ ...prev, [typingUserId]: false })), 2000);
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
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [navigate, selectedChatGroup]);

  useEffect(() => {
    if (user) fetchAvailableGroups();
  }, [user]);

  // Jitsi Meeting Functions
  const startJitsiMeeting = (classroomId, roomName) => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
    }
    const options = {
      roomName,
      width: "100%",
      height: "100%",
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: user.name,
        email: user.email,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
          "fodeviceselection", "hangup", "profile", "chat", "recording",
          "livestreaming", "etherpad", "sharedvideo", "settings", "raisehand",
          "videoquality", "filmstrip", "invite", "feedback", "stats", "shortcuts",
          "tileview", "videobackgroundblur", "download", "help", "mute-everyone",
        ],
      },
    };
    jitsiApiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", options);
    jitsiApiRef.current.addEventListener("videoConferenceJoined", () => {
      console.log("Host joined the meeting");
    });
    jitsiApiRef.current.addEventListener("readyToClose", () => {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
      setActiveSection("createdClassrooms");
    });
    setActiveSection("videoMeeting");
  };

  const joinJitsiMeeting = (classroomId, roomName) => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
    }
    const options = {
      roomName,
      width: "100%",
      height: "100%",
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: user.name,
        email: user.email,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
          "fodeviceselection", "hangup", "profile", "chat", "recording",
          "livestreaming", "etherpad", "sharedvideo", "settings", "raisehand",
          "videoquality", "filmstrip", "invite", "feedback", "stats", "shortcuts",
          "tileview", "videobackgroundblur", "download", "help", "mute-everyone",
        ],
      },
    };
    jitsiApiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", options);
    jitsiApiRef.current.addEventListener("videoConferenceJoined", () => {
      console.log("Participant joined the meeting");
    });
    jitsiApiRef.current.addEventListener("readyToClose", () => {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
      setActiveSection("invitations");
    });
    setActiveSection("videoMeeting");
  };

  const handleStartSession = async (classroomId, roomName) => {
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
        socket.emit("classroomStarted", { classroomId, roomName });
        startJitsiMeeting(classroomId, roomName);
        fetchCreatedClassrooms();
      } else {
        throw new Error(data.message || "Failed to start session");
      }
    } catch (error) {
      console.error("Error starting session:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Other handlers
  const handleJoinGroup = async (groupId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You must be logged in to join a group.");
      navigate("/login");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/study-groups/join/${groupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await response.json();
      if (response.ok) {
        const joinedGroup = data.group || { _id: groupId, name: "Unnamed Group" };
        setUser({
          ...user,
          joinedGroups: [...user.joinedGroups, { ...joinedGroup, name: joinedGroup.name || "Unnamed Group" }],
        });
        setAvailableGroups(availableGroups.filter(g => g._id !== groupId));
        alert("Joined the group successfully!");
      } else {
        throw new Error(data.message || "Failed to join group");
      }
    } catch (error) {
      console.error("Error joining group:", error);
      alert(`Error joining group: ${error.message}`);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You must be logged in to create a classroom.");
      navigate("/login");
      return;
    }

    const roomName = `Classroom-${user._id}-${Date.now()}`;
    const payload = {
      name: classroomForm.name,
      isPublic: classroomForm.isPublic,
      selectedUsers: classroomForm.selectedUsers.filter((id) => id !== user._id?.toString()),
      duration: classroomForm.duration,
      scheduledStartTime: classroomForm.scheduledStartTime,
      creator: user._id?.toString(),
      roomName,
    };

    try {
      const response = await fetch("http://localhost:5000/api/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        const classroomId = data._id || data.classroomId;
        socket.emit("notifyClassroom", {
          classroomId,
          users: payload.selectedUsers,
          creatorName: user.name,
          classroomName: payload.name,
          startTime: payload.scheduledStartTime,
          roomName,
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
      console.error("Error creating classroom:", error);
      alert(`Error creating classroom: ${error.message}`);
    }
  };

  const handleInvitationResponse = (classroomId, response, roomName) => {
    if (socket) {
      socket.emit("classroomResponse", { classroomId, userId: user._id?.toString(), response });
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.classroomId === classroomId ? { ...inv, responded: true } : inv
        )
      );
      if (response === "accept") {
        const invitation = invitations.find((inv) => inv.classroomId === classroomId);
        const scheduledTime = new Date(invitation.scheduledStartTime);
        const currentTime = new Date();
        if (currentTime >= scheduledTime) {
          joinJitsiMeeting(classroomId, roomName);
        } else {
          setWaitingForHost(classroomId);
        }
      }
    }
  };

  const handleLogout = () => {
    if (socket) socket.disconnect();
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
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
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser({
          ...user,
          joinedGroups: user.joinedGroups.filter((g) => g._id.toString() !== groupId.toString()),
        });
        fetchAvailableGroups();
        alert("Left the group successfully!");
        if (socket) {
          socket.emit("leaveGroup", { userId: user._id, groupId });
        }
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


  const handleEndSession = async (classroomId) => {
    const token = localStorage.getItem("authToken");
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      console.error("Invalid classroomId:", classroomId);
      alert("Invalid classroom ID");
      return;
    }
    try {
      const response = await fetch(`/api/classrooms/${encodeURIComponent(classroomId)}/end`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        socket.emit("classroomEnded", { classroomId });
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }
        alert("Session ended!");
        fetchCreatedClassrooms();
        setActiveSection("createdClassrooms");
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
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }
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

  const sendChatMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() && !audioBlob) return;
  
    const messageData = {
      userId: user._id,
      groupId: selectedChatGroup,
      userName: user.name,
      timestamp: new Date().toISOString(),
      messageId: `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  
    if (chatMessage.trim()) {
      messageData.message = chatMessage.trim();
      // Optimistically update local state
      setChatMessages((prev) => ({
        ...prev,
        [selectedChatGroup]: [
          ...(prev[selectedChatGroup] || []),
          messageData,
        ],
      }));
    }
  
    const token = localStorage.getItem("authToken");
  
    try {
      if (chatMessage.trim()) {
        await axios.post(
          `/api/study-groups/messages`,
          messageData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        socket?.emit("sendGroupMessage", messageData);
      }
  
      if (audioBlob) {
        const formData = new FormData();
        formData.append("audio", audioBlob, "voice-note.mp3");
        formData.append("userId", user._id);
        formData.append("groupId", selectedChatGroup);
        formData.append("userName", user.name);
  
        const response = await axios.post(
          "/api/study-groups/send-audio",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const audioData = response.data;
        messageData.audioUrl = audioData.audioUrl;
        await axios.post(
          "/api/study-groups/messages",
          messageData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        socket?.emit("sendGroupMessage", messageData);
      }
  
      setChatMessage("");
      setAudioBlob(null);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
      // Revert optimistic update if the server call fails
      setChatMessages((prev) => {
        const updatedMessages = { ...prev };
        updatedMessages[selectedChatGroup] = (updatedMessages[selectedChatGroup] || []).filter(
          msg => msg.messageId !== messageData.messageId
        );
        return updatedMessages;
      });
    }
  }, [chatMessage, user, selectedChatGroup, socket, audioBlob]);

  const handleChatTyping = useCallback(() => {
    if (socket && chatMessage.length > 0 && user?._id && selectedChatGroup) {
      socket.emit("typing", { userId: user._id, groupId: selectedChatGroup });
    }
  }, [socket, chatMessage, user, selectedChatGroup]);

  const handleEmojiClick = (emojiObject) => {
    setChatMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user._id);
      formData.append("groupId", selectedChatGroup);
      formData.append("userName", user.name);
      formData.append("fileName", file.name);

      try {
        const response = await axios.post(
          "http://localhost:5000/api/study-groups/send-file",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        const fileData = response.data;
        const messageData = {
          userId: user._id,
          groupId: selectedChatGroup,
          userName: user.name,
          fileUrl: fileData.fileUrl,
          fileName: file.name,
          timestamp: new Date().toISOString(),
          messageId: `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        await axios.post(
          "http://localhost:5000/api/study-groups/messages",
          messageData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        socket?.emit("sendGroupMessage", messageData);
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to send file.");
      }
    }
  };

  const openModal = (fileUrl, fileName, isImage) => {
    setModalFileUrl(fileUrl);
    setModalFileName(fileName);
    setIsModalImage(isImage);
    setModalOpen(true);
  };

  const getGroupMembers = useCallback(() => {
    if (!selectedChatGroup || !user?.joinedGroups) return [];
    const group = user.joinedGroups.find(g => g._id === selectedChatGroup);
    if (!group) return [];
  
    const members = group.members || [];
    const onlineUsersInGroup = onlineUsers[selectedChatGroup] || [];
  
    const memberList = members
      .map(member => {
        let userId, name;
        if (member === null || member === undefined) {
          console.warn("Skipping invalid member (null or undefined):", member);
          return null;
        }
        if (typeof member === 'object' && member !== null) {
          userId = member._id || member.userId || member.id || null;
          name = member.name || member.userName || member.username || "Unknown";
        } else if (typeof member === 'string') {
          userId = member;
          const onlineUser = onlineUsersInGroup.find(u => u.userId === userId);
          name = onlineUser ? onlineUser.name : `User ${userId.slice(-4)}`;
        } else {
          console.warn("Invalid member type:", member);
          return null;
        }
  
        if (!userId) {
          console.warn("Member object missing userId:", member);
          return null;
        }
  
        return {
          userId,
          name,
          isActive: onlineUsersInGroup.some(u => u.userId === userId),
        };
      })
      .filter(member => member !== null) || [];
  
    return [...memberList.filter(member => member.isActive), ...memberList.filter(member => !member.isActive)];
  }, [selectedChatGroup, user, onlineUsers]);

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#1a1d26", color: "#ff4444" }}>
        <div className="text-center">
          <p>Error: {error}</p>
          <button className="btn btn-purple" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#1a1d26", color: "#ffffff" }}>
        <div className="text-center">
          <p>Loading user details...</p>
          <div className="spinner-border text-purple" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="d-flex" style={{ minHeight: "90vh", backgroundColor: "#1a1d26" }}>
        <nav className="sidebar bg-dark text-white p-2" style={{ width: "250px", position: "fixed", height: "100vh", backgroundColor: "#2b2e3c" }}>
          <h3 className="mb-3 text-center" style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff" }}>
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
              <li key={item.section} className="nav-item mb-2">
                <button
                  className={`btn w-100 text-left py-2 d-flex align-items-center ${activeSection === item.section ? "btn-purple" : ""}`}
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    borderRadius: "6px",
                    backgroundColor: activeSection === item.section ? "#9C27B0" : "transparent",
                    border: "none",
                    color: "#ffffff",
                  }}
                  onClick={() => {
                    setActiveSection(item.section);
                    if (item.section !== "groupChat" && activeSection === "videoMeeting" && jitsiApiRef.current) {
                      jitsiApiRef.current.dispose();
                      jitsiApiRef.current = null;
                    }
                    if (item.section !== "groupChat") setSelectedChatGroup(null);
                  }}
                >
                  <span className="me-2" style={{ fontSize: "1rem" }}>{item.icon}</span>
                  {item.name}
                </button>
              </li>
            ))}
            <li className="nav-item mb-2">
              <button
                className="btn btn-danger w-100 py-2 d-flex align-items-center"
                onClick={handleLogout}
              >
                <span className="me-2">🚪</span>Logout
              </button>
            </li>
          </ul>
        </nav>

        <main className="flex-grow-1 p-3" style={{ marginLeft: "250px", backgroundColor: "#1a1d26" }}>
          {activeSection === "userInfo" && (
            <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
              <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>User Information</h4>
              {editMode ? (
                <form onSubmit={handleUpdateUser}>
                  <div className="mb-2">
                    <label htmlFor="nameInput" className="form-label" style={{ color: "#ffffff" }}>Name:</label>
                    <input
                      type="text"
                      id="nameInput"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="emailInput" className="form-label" style={{ color: "#ffffff" }}>Email:</label>
                    <input
                      type="email"
                      id="emailInput"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
                    />
                  </div>
                  <div className="d-flex justify-content-between">
                    <button type="submit" className="btn btn-purple">Save</button>
                    <button type="button" className="btn btn-gray" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="text-center">
                  <p style={{ color: "#ffffff" }}><strong>Email:</strong> {user.email}</p>
                  <p style={{ color: "#ffffff" }}><strong>Role:</strong> {user.role}</p>
                  <button className="btn btn-purple" onClick={() => setEditMode(true)}>Update Info</button>
                </div>
              )}
            </div>
          )}

     
          {activeSection === "joinedGroups" && (
  <div>
    <div className="card p-2 mb-3" style={{ backgroundColor: "transparent", width: "100%", margin: "0 auto" }}>
      <h4 className="mb-3" style={{ color: "#9C27B0", fontSize: "1.2rem", fontWeight: "600" }}>Joined Study Groups</h4>
      <div className="d-flex flex-wrap gap-2 pb-2" style={{ justifyContent: "flex-start" }}>
        {user.joinedGroups && user.joinedGroups.length > 0 ? (
          user.joinedGroups.map((group) => (
            <div key={group._id} className="card flex-shrink-0" style={{ width: "160px", height: "180px", backgroundColor: "#2d2d2d", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "8px" }}>
              <div className="card-body text-center flex-grow-1 d-flex flex-column justify-content-between">
                <div style={{ width: "60px", height: "60px", margin: "0 auto 8px", borderRadius: "10px", backgroundColor: "#ffffff", overflow: "hidden" }}>
                  <img
                    src={group.image || "/default-group-icon.png"}
                    alt={`${group.name} icon`}
                    onError={(e) => { e.target.src = "/default-group-icon.png"; }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <h5 className="card-title mb-1" style={{ fontSize: "0.9rem", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name || "Unnamed Group"}</h5>
                <p className="mb-2" style={{ fontSize: "0.75rem", color: "#7f8c8d" }}>Free</p>
                <div className="d-flex justify-content-between gap-1">
                  <button className="btn btn-warning flex-grow-1" style={{ padding: "4px 0", fontSize: "0.75rem" }} onClick={() => handleLeaveGroup(group._id)}>Leave</button>
                  <button className="btn btn-purple flex-grow-1" style={{ padding: "4px 0", fontSize: "0.75rem" }} onClick={() => { setActiveSection("groupChat"); setSelectedChatGroup(group._id); socket?.emit("joinGroupChat", { userId: user._id, groupId: group._id }); }}>Chat</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted text-center w-100" style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>You haven't joined any study groups yet.</p>
        )}
      </div>
    </div>
    <div className="card p-2 mb-3" style={{ backgroundColor: "transparent", width: "100%", margin: "0 auto" }}>
      <h5 className="mb-3" style={{ color: "#9C27B0", fontSize: "1.2rem", fontWeight: "600" }}>Available Study Groups</h5>
      <div className="d-flex flex-wrap gap-2 pb-2" style={{ justifyContent: "flex-start" }}>
        {availableGroups.length > 0 ? (
          availableGroups.map((group) => (
            <div key={group._id} className="card flex-shrink-0" style={{ width: "160px", height: "180px", backgroundColor: "#2d2d2d", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "8px" }}>
              <div className="card-body text-center flex-grow-1 d-flex flex-column justify-content-between">
                <div style={{ width: "60px", height: "60px", margin: "0 auto 8px", borderRadius: "10px", backgroundColor: "#ffffff", overflow: "hidden" }}>
                  <img
                    src={group.image || "/default-group-icon.png"}
                    alt={`${group.name} icon`}
                    onError={(e) => { e.target.src = "/default-group-icon.png"; }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <h5 className="card-title mb-1" style={{ fontSize: "0.9rem", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name || "Unnamed Group"}</h5>
                <p className="mb-2" style={{ fontSize: "0.75rem", color: "#7f8c8d" }}>Free</p>
                <div className="d-flex justify-content-center">
                  <button className="btn btn-success w-100" style={{ padding: "6px 0", fontSize: "0.75rem" }} onClick={() => handleJoinGroup(group._id)}>Join</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted text-center w-100" style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>No available study groups to join.</p>
        )}
      </div>
    </div>
  </div>
)}

          {activeSection === "onlineUsers" && (
            <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
              <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Online Users in Your Groups</h4>
              {user.joinedGroups && user.joinedGroups.length > 0 ? (
                user.joinedGroups.map((group) => (
                  <div key={group._id} className="mb-3">
                    <h5 className="mb-2" style={{ color: "#9C27B0" }}>{group.name}</h5>
                    <ul className="list-group">
                      {(onlineUsers[group._id] || []).length > 0 ? (
                        onlineUsers[group._id].map(({ userId, name }) => (
                          <li key={userId} className="list-group-item d-flex justify-content-between align-items-center py-1" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
                            <span>{user._id?.toString() === userId ? `${name}(me)` : name}</span>
                            <input
                              type="checkbox"
                              checked={classroomForm.selectedUsers.includes(userId)}
                              onChange={() => toggleUserSelection(userId)}
                              disabled={userId === user._id?.toString()}
                            />
                          </li>
                        ))
                      ) : (
                        <p className="text-muted" style={{ color: "#7f8c8d" }}>No online users in this group.</p>
                      )}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center" style={{ color: "#7f8c8d" }}>Join a group to see online users.</p>
              )}
            </div>
          )}

          {activeSection === "createClassroom" && (
            <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
              <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Create a Classroom</h4>
              <form onSubmit={handleCreateClassroom}>
                <div className="mb-2">
                  <label htmlFor="classroomName" className="form-label" style={{ color: "#ffffff" }}>Classroom Name:</label>
                  <input
                    type="text"
                    id="classroomName"
                    className="form-control"
                    value={classroomForm.name}
                    onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                    required
                    style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
                  />
                </div>
                <div className="mb-2">
                  <label htmlFor="duration" className="form-label" style={{ color: "#ffffff" }}>Duration (minutes):</label>
                  <input
                    type="number"
                    id="duration"
                    className="form-control"
                    value={classroomForm.duration}
                    onChange={(e) => setClassroomForm({ ...classroomForm, duration: parseInt(e.target.value) || 60 })}
                    min="1"
                    required
                    style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
                  />
                </div>
                <div className="mb-2">
                  <label htmlFor="startTime" className="form-label" style={{ color: "#ffffff" }}>Scheduled Start Time:</label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    className="form-control"
                    value={classroomForm.scheduledStartTime}
                    onChange={(e) => setClassroomForm({ ...classroomForm, scheduledStartTime: e.target.value })}
                    required
                    style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label" style={{ color: "#ffffff" }}>Access:</label>
                  <select
                    className="form-control"
                    value={classroomForm.isPublic}
                    onChange={(e) => setClassroomForm({ ...classroomForm, isPublic: e.target.value === "true" })}
                    disabled
                    style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
                  >
                    <option value="false">Private (Selected users only)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#ffffff" }}>Select Users to Invite:</label>
                  <ul className="list-group">
                    {Object.entries(onlineUsers)
                      .flatMap(([, users]) => users)
                      .filter((user, index, self) => index === self.findIndex((u) => u.userId === user.userId))
                      .map(({ userId, name }) => (
                        <li key={userId} className="list-group-item d-flex justify-content-between align-items-center py-1" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
                          <label className="form-check-label d-flex align-items-center w-100">
                            <input
                              type="checkbox"
                              className="form-check-input me-1"
                              checked={classroomForm.selectedUsers.includes(userId)}
                              onChange={() => toggleUserSelection(userId)}
                              disabled={userId === user._id?.toString()}
                            />
                            {name} {userId === user._id?.toString() ? "(me)" : ""}
                          </label>
                        </li>
                      ))}
                  </ul>
                </div>
                <button type="submit" className="btn btn-purple w-100">Create Classroom & Send Invites</button>
              </form>
            </div>
          )}

        
{activeSection === "createdClassrooms" && (
  <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
    <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Your Created Classrooms</h4>
    <div className="mb-3" style={{ backgroundColor: "#3c3f4c", padding: "10px", borderRadius: "5px" }}>
      <h5 style={{ color: "#9C27B0" }}>Schedule a New Classroom</h5>
      <form onSubmit={(e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const startTime = new Date(e.target.startTime.value).toISOString();
        const duration = parseInt(e.target.duration.value, 10);
        if (name && startTime && duration) {
          const classroom = { name, scheduledStartTime: startTime, duration, isActive: false };
          socket.emit('createClassroom', { ...classroom, userId: user._id, groupId: selectedGroupId });
          e.target.reset();
        }
      }}>
        <div className="mb-2">
          <input
            type="text"
            name="name"
            placeholder="Classroom Name"
            className="form-control"
            style={{ backgroundColor: "#2b2e3c", color: "#ffffff", border: "1px solid #9C27B0" }}
            required
          />
        </div>
        <div className="mb-2">
          <input
            type="datetime-local"
            name="startTime"
            className="form-control"
            style={{ backgroundColor: "#2b2e3c", color: "#ffffff", border: "1px solid #9C27B0" }}
            required
          />
        </div>
        <div className="mb-2">
          <input
            type="number"
            name="duration"
            placeholder="Duration (minutes)"
            className="form-control"
            style={{ backgroundColor: "#2b2e3c", color: "#ffffff", border: "1px solid #9C27B0" }}
            min="1"
            required
          />
        </div>
        <button type="submit" className="btn btn-purple btn-sm">Schedule Classroom</button>
      </form>
    </div>
    {createdClassrooms.length > 0 ? (
      <ul className="list-group">
        {createdClassrooms.map((classroom) => (
          <li key={classroom._id} className="list-group-item py-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
            <div>
              {classroom.name} - 
              <span style={{ color: classroom.isActive ? "#9C27B0" : "#7f8c8d" }}>
                {classroom.isActive ? "Active" : "Scheduled/Inactive"}
              </span> -
              Starts: {new Date(classroom.scheduledStartTime).toLocaleString()} -
              Duration: {classroom.duration} minutes
            </div>
            {!classroom.isActive && (
              <div className="mt-2" style={{ backgroundColor: "#2b2e3c", padding: "10px", borderRadius: "5px" }}>
                <p style={{ color: "#7f8c8d" }}>Invitation Link: <a href={classroom.invitationLink} target="_blank" rel="noopener noreferrer" style={{ color: "#9C27B0" }}>{classroom.invitationLink}</a></p>
                <button
                  className="btn btn-blue btn-sm"
                  onClick={() => navigator.clipboard.writeText(classroom.invitationLink)}
                >
                  Copy Link
                </button>
              </div>
            )}
            <div className="mt-2 d-flex justify-content-between flex-wrap gap-1">
              <button
                className="btn btn-blue btn-sm"
                onClick={() => handleSetDuration(classroom._id, prompt("New duration (minutes):", classroom.duration) || classroom.duration)}
                disabled={classroom.isActive}
              >
                Update Duration
              </button>
              <button
                className="btn btn-purple btn-sm"
                onClick={() => {
                  const scheduledTime = new Date(classroom.scheduledStartTime);
                  const currentTime = new Date();
                  if (currentTime >= scheduledTime) {
                    handleStartSession(classroom._id, classroom.roomName);
                  } else {
                    alert(`Meeting is scheduled for ${scheduledTime.toLocaleString()}`);
                  }
                }}
                disabled={classroom.isActive}
              >
                Start Session
              </button>
              <button
                className="btn btn-yellow btn-sm"
                onClick={() => handleEndSession(classroom._id)}
                disabled={!classroom.isActive}
              >
                End Session
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteSession(classroom._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-muted text-center" style={{ color: "#7f8c8d" }}>You haven’t created any classrooms yet.</p>
    )}
  </div>
)}
          {activeSection === "invitations" && (
            <div className="card p-3 mb-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "800px", margin: "0 auto" }}>
              <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Pending Invitations</h4>
              {invitations.length > 0 ? (
                <ul className="list-group">
                  {invitations.map((inv, index) =>
                    !inv.responded ? (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
                        <span>{inv.message}</span>
                        <div>
                          <button className="btn btn-blue btn-sm me-2" onClick={() => handleInvitationResponse(inv.classroomId, "accept", inv.roomName)}>
                            Accept
                          </button>
                          <button className="btn btn-gray btn-sm" onClick={() => handleInvitationResponse(inv.classroomId, "decline", inv.roomName)}>
                            Decline
                          </button>
                        </div>
                      </li>
                    ) : waitingForHost === inv.classroomId ? (
                      <li key={index} className="list-group-item text-center py-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
                        Waiting for meeting to start for "{inv.classroomName}" at {new Date(inv.scheduledStartTime).toLocaleString()}...
                        <div className="spinner-border text-purple mt-1" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </li>
                    ) : null
                  )}
                </ul>
              ) : (
                <p className="text-muted text-center" style={{ color: "#7f8c8d" }}>No pending invitations.</p>
              )}
            </div>
          )}

      
{activeSection === "groupChat" && selectedChatGroup && (
  <div className="d-flex" style={{ position: "relative", height: "calc(100vh - 100px)" }}>
    <div className="card p-3 flex-grow-1" style={{ backgroundColor: "#2b2e3c", maxWidth: "calc(100% - 300px)", marginRight: "10px", position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
      <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>
        {user.joinedGroups.find(g => g._id === selectedChatGroup)?.name || "Group Chat"}
      </h4>
      {Object.entries(isTyping).some(([_, typing]) => typing) && (
        <p className="text-muted text-center" style={{ color: "#7f8c8d" }}>Someone is typing...</p>
      )}
      <div className="mb-3 p-3 flex-grow-1" style={{ backgroundColor: "#3c3f4c", overflowY: "auto", maxHeight: "calc(100% - 100px)", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <style>{`.mb-3::-webkit-scrollbar { display: none; }`}</style>
        {(chatMessages[selectedChatGroup] || []).map((msg, index) => {
          const prevMsg = chatMessages[selectedChatGroup][index - 1];
          const isFirstOfSequence = !prevMsg || prevMsg.userId !== msg.userId;
          const isCurrentUser = msg.userId === user._id;

          return isCurrentUser ? (
            <div key={msg.messageId || index} className="d-flex justify-content-end mb-3">
              <div style={{ maxWidth: "70%", position: "relative", marginLeft: "50px" }}>
                <div style={{ 
                  backgroundColor: "#9C27B0", 
                  color: "#FFFFFF", 
                  padding: "8px 12px", 
                  borderRadius: "10px", 
                  position: "relative", 
                  marginLeft: "20px",
                  borderBottomRightRadius: "0"
                }} 
                before={{
                  content: "''",
                  position: "absolute",
                  bottom: "-10px",
                  right: "0",
                  width: "0",
                  height: "0",
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "10px solid #9C27B0"
                }}>
                  <span style={{ display: "block" }}>{msg.message}</span>
                  {msg.audioUrl && <audio controls src={msg.audioUrl} />}
                  {msg.fileUrl && (
                    <div className="mt-1" onClick={() => openModal(msg.fileUrl, msg.fileName, msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/))}>
                      {msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/) ? (
                        <img src={msg.fileUrl} alt={msg.fileName || "File"} style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "5px", cursor: "pointer" }} />
                      ) : (
                        <span className="d-flex align-items-center" style={{ cursor: "pointer" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                          </svg>
                          {msg.fileName || "File"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <small style={{ color: "#666666", fontSize: "0.7rem", marginTop: "5px", display: "block", textAlign: "right" }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          ) : (
            <div key={msg.messageId || index} className="d-flex mb-3">
              {isFirstOfSequence && (
                <div style={{ position: "relative", marginRight: "10px", marginTop: "10px" }}>
                  {msg.avatar ? (
                    <img
                      src={msg.avatar}
                      alt={`${msg.userName} avatar`}
                      onError={(e) => { e.target.style.display = "none"; }}
                      style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                    />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#9C27B0", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
                      {msg.userName ? msg.userName.charAt(0) : "?"}
                    </div>
                  )}
                </div>
              )}
              <div style={{ maxWidth: "70%", position: "relative", marginLeft: isFirstOfSequence ? "0" : "50px" }}>
                {isFirstOfSequence && (
                  <div style={{ 
                    color: "#000000", 
                    fontSize: "0.9rem", 
                    marginBottom: "2px"
                  }}>
                    {msg.userName || "Unknown"}
                  </div>
                )}
                <div style={{ 
                  backgroundColor: "#E5E5EA", 
                  color: "#000000", 
                  padding: "8px 12px", 
                  borderRadius: "10px", 
                  position: "relative", 
                  marginRight: "20px",
                  borderBottomLeftRadius: "0"
                }} 
                before={{
                  content: "''",
                  position: "absolute",
                  bottom: "-10px",
                  left: "0",
                  width: "0",
                  height: "0",
                  borderRight: "10px solid transparent",
                  borderLeft: "10px solid transparent",
                  borderTop: "10px solid #E5E5EA"
                }}>
                  <span style={{ display: "block" }}>{msg.message}</span>
                  {msg.audioUrl && <audio controls src={msg.audioUrl} />}
                  {msg.fileUrl && (
                    <div className="mt-1" onClick={() => openModal(msg.fileUrl, msg.fileName, msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/))}>
                      {msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/) ? (
                        <img src={msg.fileUrl} alt={msg.fileName || "File"} style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "5px", cursor: "pointer" }} />
                      ) : (
                        <span className="d-flex align-items-center" style={{ cursor: "pointer" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                          </svg>
                          {msg.fileName || "File"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <small style={{ color: "#666666", fontSize: "0.7rem", marginTop: "5px", display: "block" }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="d-flex gap-2 align-items-center p-2" style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#2b2e3c" }}>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (chatMessage.trim()) {
            const messageId = `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newMessage = {
              userId: user._id,
              groupId: selectedChatGroup,
              userName: user.name,
              message: chatMessage,
              timestamp: new Date().toISOString(),
              audioUrl: null,
              audioDuration: 0,
              fileUrl: null,
              fileName: null,
              messageId,
            };
            socket.emit('sendGroupMessage', newMessage);
            setChatMessage('');
          }
        }} className="d-flex gap-2 align-items-center flex-grow-1">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => {
              setChatMessage(e.target.value);
              handleChatTyping();
            }}
            placeholder="Type a message..."
            className="form-control flex-grow-1"
            style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}
          />
          <button 
            type="button" 
            className="btn p-2" 
            style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }} 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </button>
          <label className="btn p-2" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
            <Paperclip size={20} />
            <input
              type="file"
              className="d-none"
              onChange={handleFileUpload}
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
          </label>
          <button
            type="button"
            className="btn p-2"
            style={{ backgroundColor: isRecording ? "#ff4444" : "#3c3f4c", color: "#ffffff" }}
            onClick={isRecording ? stopRecording : startRecording}
          >
            <Mic size={20} />
          </button>
          <button type="submit" className="btn btn-purple">Send</button>
        </form>
        {showEmojiPicker && (
          <div style={{ position: "absolute", bottom: "60px", right: "20px", zIndex: 1000 }}>
            <Picker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        fileUrl={modalFileUrl}
        fileName={modalFileName}
        isImage={isModalImage}
      />
    </div>

    <aside className="sidebar bg-dark text-white p-2" style={{ width: "300px", position: "fixed", right: 0, height: "100vh", backgroundColor: "#2b2e3c", zIndex: 900 }}>
      <h5 className="mb-3 text-center" style={{ fontSize: "1rem", fontWeight: "600", color: "#9C27B0" }}>Group Members</h5>
      <ul className="list-group">
        {getGroupMembers().map((member) => (
          <li key={member.userId} className="list-group-item d-flex justify-content-between align-items-center py-1" style={{ backgroundColor: "#3c3f4c", color: "#ffffff" }}>
            <span>{member.userId === user._id ? `${member.name} (me)` : member.name}</span>
            {member.isActive && <span style={{ color: "#00ff00", fontSize: "10px" }}>●</span>}
          </li>
        ))}
      </ul>
    </aside>
  </div>
)}
          {activeSection === "videoMeeting" && (
            <div className="card p-3" style={{ backgroundColor: "#2b2e3c", maxWidth: "100%", margin: "0 auto", height: "80vh" }}>
              <h4 className="mb-3" style={{ color: "#9C27B0", textAlign: "center" }}>Video Meeting</h4>
              <div ref={jitsiContainerRef} style={{ width: "100%", height: "100%" }} />
            </div>
          )}
        </main>
      </div>
      <style>
        {`
          .bg-purple-600 { background-color: #9C27B0 !important; }
          .bg-gray-700 { background-color: #3c3f4c !important; }
          .btn-purple { background-color: #9C27B0; border-color: #9C27B0; color: #ffffff; }
          .btn-purple:hover { background-color: #7B1FA2; border-color: #7B1FA2; }
          .btn-blue { background-color: #0288D1; border-color: #0288D1; color: #ffffff; }
          .btn-blue:hover { background-color: #0277BD; border-color: #0277BD; }
          .btn-yellow { background-color: #FBC02D; border-color: #FBC02D; color: #000000; }
          .btn-yellow:hover { background-color: #F9A825; border-color: #F9A825; }
          .btn-gray { background-color: #616161; border-color: #616161; color: #ffffff; }
          .btn-gray:hover { background-color: #424242; border-color: #424242; }
        `}
      </style>
    </ErrorBoundary>
  );
};

export default UserDashboard;