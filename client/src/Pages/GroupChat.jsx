// import React, { useEffect, useState, useRef, useCallback } from "react";
// import Picker from "emoji-picker-react";
// import { Mic, Paperclip } from "react-feather";
// import axios from "axios";

// const FilePreview = ({ fileUrl, fileName, fileSizeKB, fileType }) => {
//   const handleOpen = () => window.open(fileUrl, "_blank");
//   const handleSave = () => {
//     const link = document.createElement("a");
//     link.href = fileUrl;
//     link.download = fileName;
//     link.click();
//   };

//   return (
//     <div
//       style={{
//         backgroundColor: "#28a745",
//         padding: "10px",
//         borderRadius: "5px",
//         margin: "5px 0",
//         color: "#fff",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         maxWidth: "200px",
//       }}
//     >
//       <span role="img" aria-label="file" style={{ fontSize: "24px" }}>
//         📄
//       </span>
//       <p style={{ margin: "5px 0", fontSize: "14px" }}>{fileName || "Unnamed File"}</p>
//       <p style={{ margin: "0", fontSize: "12px" }}>
//         {fileSizeKB} KB, {fileType} {fileType === "PDF" && "Document"}
//       </p>
//       <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
//         <button
//           onClick={handleOpen}
//           style={{
//             backgroundColor: "#fff",
//             color: "#28a745",
//             border: "none",
//             padding: "5px 10px",
//             borderRadius: "3px",
//             cursor: "pointer",
//           }}
//         >
//           Open
//         </button>
//         <button
//           onClick={handleSave}
//           style={{
//             backgroundColor: "#fff",
//             color: "#28a745",
//             border: "none",
//             padding: "5px 10px",
//             borderRadius: "3px",
//             cursor: "pointer",
//           }}
//         >
//           Save as...
//         </button>
//       </div>
//     </div>
//   );
// };

// const GroupChat = ({ socket, user, joinedGroups, selectedChatGroup, setSelectedChatGroup }) => {
//   const [chatMessages, setChatMessages] = useState({});
//   const [chatMessage, setChatMessage] = useState("");
//   const [isTyping, setIsTyping] = useState({});
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioBlob, setAudioBlob] = useState(null);
//   const [audioDuration, setAudioDuration] = useState(0);
//   const [joinedUsers, setJoinedUsers] = useState([]);
//   const [activeUsers, setActiveUsers] = useState([]);
//   const messagesEndRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   useEffect(() => {
//     if (socket && selectedChatGroup) {
//       console.log("Joining group chat:", selectedChatGroup);
//       socket.emit("joinGroupChat", { userId: user._id, groupId: selectedChatGroup });

//       const fetchChatHistory = async () => {
//         if (!selectedChatGroup) {
//           console.log("No selectedChatGroup, skipping fetch");
//           return;
//         }
//         try {
//           console.log("Fetching chat history for group:", selectedChatGroup);
//           const response = await axios.get(`/api/studygroups/${selectedChatGroup}/messages`, {
//             headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
//           });
//           console.log("Fetched messages response:", response.data);
//           if (!response.data.messages) {
//             console.warn("No messages found in response");
//           }
//           setChatMessages((prev) => ({
//             ...prev,
//             [selectedChatGroup]: response.data.messages || [],
//           }));
//           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//         } catch (error) {
//           console.error("Error fetching chat history:", {
//             status: error.response?.status,
//             data: error.response?.data,
//             message: error.message,
//           });
//         }
//       };
//       fetchChatHistory();

//       socket.on("receiveGroupMessage", (messageData) => {
//         if (messageData.groupId === selectedChatGroup) {
//           console.log("Received message:", messageData);
//           setChatMessages((prev) => ({
//             ...prev,
//             [messageData.groupId]: [
//               ...(prev[messageData.groupId] || []),
//               messageData,
//             ].filter((msg, index, self) => index === self.findIndex((m) => m.messageId === msg.messageId)),
//           }));
//           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//         }
//       });

//       socket.on("userJoinedGroup", ({ groupId, userId, userName }) => {
//         if (groupId === selectedChatGroup) {
//           console.log("User joined:", { userId, userName });
//           setJoinedUsers((prev) => [...new Set([...prev, { userId, userName }])]);
//         }
//       });

//       socket.on("userLeftGroup", ({ groupId, userId }) => {
//         if (groupId === selectedChatGroup) {
//           console.log("User left:", { userId });
//           setJoinedUsers((prev) => prev.filter((u) => u.userId !== userId));
//         }
//       });

//       socket.on("userActivity", ({ groupId, userId, isActive, userName }) => {
//         if (groupId === selectedChatGroup) {
//           console.log("User activity:", { userId, isActive, userName });
//           if (isActive) {
//             setActiveUsers((prev) => [...new Set([...prev, { userId, userName }])]);
//           } else {
//             setActiveUsers((prev) => prev.filter((u) => u.userId !== userId));
//           }
//         }
//       });

//       const fetchJoinedUsers = async () => {
//         try {
//           console.log("Fetching joined users for group:", selectedChatGroup);
//           const response = await axios.get(`/api/studygroups/${selectedChatGroup}/users`, {
//             headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
//           });
//           console.log("Fetched joined users:", response.data.users);
//           setJoinedUsers(response.data.users || []);
//         } catch (error) {
//           console.error("Error fetching joined users:", error);
//         }
//       };
//       fetchJoinedUsers();

//       socket.on("connect_error", (err) => console.error("Socket connection error:", err.message));

//       return () => {
//         socket.off("receiveGroupMessage");
//         socket.off("userJoinedGroup");
//         socket.off("userLeftGroup");
//         socket.off("userActivity");
//         socket.off("connect_error");
//       };
//     }
//   }, [socket, selectedChatGroup, user._id]);

//   const sendChatMessage = useCallback(
//     async (e) => {
//       e.preventDefault();
//       if (!chatMessage.trim() && !audioBlob) return;

//       const messageData = {
//         userId: user._id,
//         groupId: selectedChatGroup,
//         userName: user.name,
//         timestamp: new Date().toISOString(),
//         messageId: `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       };

//       if (chatMessage.trim()) {
//         messageData.message = chatMessage.trim();
//         try {
//           console.log("Sending message to server:", messageData);
//           const response = await axios.post(
//             "/api/studygroups/messages",
//             messageData,
//             {
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//               },
//             }
//           );
//           console.log("Message saved response:", response.data);
//         } catch (error) {
//           console.error("Error saving message:", {
//             status: error.response?.status,
//             data: error.response?.data,
//             message: error.message,
//           });
//         }
//         socket?.emit("sendGroupMessage", messageData);
//       }

//       if (audioBlob) {
//         const formData = new FormData();
//         formData.append("audio", audioBlob, "voice-note.mp3");
//         formData.append("userId", user._id);
//         formData.append("groupId", selectedChatGroup);
//         formData.append("userName", user.name);

//         try {
//           const response = await axios.post(
//             "/api/studygroups/send-audio",
//             formData,
//             {
//               headers: {
//                 "Content-Type": "multipart/form-data",
//                 Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//               },
//             }
//           );
//           const audioData = response.data;
//           messageData.audioUrl = audioData.audioUrl;
//           messageData.audioDuration = audioDuration;

//           await axios.post(
//             "/api/studygroups/messages",
//             messageData,
//             {
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//               },
//             }
//           );
//           socket?.emit("sendGroupMessage", messageData);
//         } catch (error) {
//           console.error("Error uploading voice note:", error);
//           alert("Failed to send voice note.");
//         }
//         setAudioBlob(null);
//         setAudioDuration(0);
//       }

//       if (chatMessage.trim() || audioBlob) setChatMessage("");
//     },
//     [chatMessage, user, selectedChatGroup, socket, audioBlob, audioDuration]
//   );

//   const handleChatTyping = useCallback(() => {
//     if (socket && chatMessage.length > 0 && user?._id && selectedChatGroup) {
//       socket.emit("typing", { userId: user._id, groupId: selectedChatGroup });
//     }
//   }, [socket, chatMessage, user, selectedChatGroup]);

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

//         const audioUrl = URL.createObjectURL(audioBlob);
//         const audio = new Audio(audioUrl);
//         audio.onloadedmetadata = () => {
//           setAudioDuration(audio.duration);
//           URL.revokeObjectURL(audioUrl);
//         };
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
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("userId", user._id);
//     formData.append("groupId", selectedChatGroup);
//     formData.append("userName", user.name);

//     try {
//       console.log("Uploading file for group:", selectedChatGroup);
//       const response = await axios.post("/api/studygroups/send-file", formData, {
//         headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
//       });
//       console.log("File upload response:", response.data);
//       const { fileUrl, fileName, fileSizeKB, fileType } = response.data;
//       const messageData = {
//         userId: user._id,
//         groupId: selectedChatGroup,
//         userName: user.name,
//         fileUrl,
//         fileName,
//         fileSizeKB,
//         fileType,
//         timestamp: new Date().toISOString(),
//         messageId: `${user._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       };

//       await axios.post("/api/studygroups/messages", messageData, {
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
//       });
//       socket?.emit("sendGroupMessage", messageData);
//     } catch (error) {
//       console.error("Error uploading file:", {
//         status: error.response?.status,
//         data: error.response?.data,
//         message: error.message,
//       });
//       alert("Failed to upload file.");
//     }
//   };

//   return (
//     <div className="d-flex" style={{ height: "80vh", backgroundColor: "#f0f2f5" }}>
//       {/* Chat List (Left Sidebar) */}
//       <div
//         className="bg-dark text-white p-2"
//         style={{ width: "30%", borderRight: "1px solid #ddd", overflowY: "auto" }}
//       >
//         <h5 className="mb-3 p-2" style={{ borderBottom: "1px solid #333" }}>
//           Chats
//         </h5>
//         <input
//           type="text"
//           placeholder="Search or start a new chat"
//           className="form-control mb-2"
//           style={{ backgroundColor: "#333", color: "#fff", border: "none" }}
//         />
//         {joinedGroups.map((group) => (
//           <div
//             key={group._id}
//             className={`d-flex align-items-center p-2 ${selectedChatGroup === group._id ? "bg-secondary" : ""}`}
//             style={{ cursor: "pointer" }}
//             onClick={() => setSelectedChatGroup(group._id)}
//           >
//             <img
//               src="https://picsum.photos/60"
//               alt="Profile"
//               className="rounded-circle me-2"
//               style={{ width: "40px", height: "40px" }}
//             />
//             <div className="flex-grow-1">
//               <div className="d-flex justify-content-between">
//                 <h6 className="mb-0" style={{ color: "#fff" }}>
//                   {group.name}
//                 </h6>
//                 <small style={{ color: "#ccc" }}>Today</small>
//               </div>
//               <p className="mb-0" style={{ color: "#bbb", fontSize: "0.9rem" }}>
//                 Last message
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Chat Area (Main Section) */}
//       <div className="flex-grow-1 d-flex flex-column" style={{ backgroundColor: "#e5ddd5", minHeight: "0" }}>
//         {selectedChatGroup ? (
//           <>
//             <div
//               className="p-2"
//               style={{ backgroundColor: "#075e54", color: "#fff", borderBottom: "1px solid #ccc" }}
//             >
//               <h5 className="mb-0">Group Name</h5> {/* Placeholder, replace with dynamic name if needed */}
//             </div>
//             <div
//               className="flex-grow-1 p-3 overflow-auto"
//               style={{ backgroundColor: "#fff", color: "#000", minHeight: "0" }}
//             >
//               {(chatMessages[selectedChatGroup] || []).map((msg, index) => (
//                 <div
//                   key={index}
//                   className={`d-flex ${msg.userId === user._id ? "justify-content-end" : "justify-content-start"} mb-2`}
//                 >
//                   <div
//                     className={`p-2 rounded ${msg.userId === user._id ? "bg-purple-500" : "bg-gray-200"}`}
//                     style={{
//                       maxWidth: "60%",
//                       boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
//                       color: msg.userId === user._id ? "#fff" : "#000",
//                     }}
//                   >
//                     <small
//                       className="d-block text-muted"
//                       style={{ fontSize: "0.7rem" }}
//                     >
//                       {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
//                     </small>
//                     {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
//                     {msg.audioUrl && (
//                       <div>
//                         <audio controls src={msg.audioUrl} />
//                         <p style={{ margin: 0 }}>
//                           Duration: {msg.audioDuration ? `${Math.floor(msg.audioDuration / 60)}:${Math.floor(msg.audioDuration % 60).toString().padStart(2, "0")} min` : "Loading..."}
//                         </p>
//                       </div>
//                     )}
//                     {msg.fileUrl && (
//                       <FilePreview
//                         fileUrl={msg.fileUrl}
//                         fileName={msg.fileName}
//                         fileSizeKB={msg.fileSizeKB || "Unknown"}
//                         fileType={msg.fileType || "FILE"}
//                       />
//                     )}
//                   </div>
//                 </div>
//               ))}
//               <div ref={messagesEndRef} />
//             </div>
//             <form
//               onSubmit={sendChatMessage}
//               className="p-2 bg-white d-flex align-items-center"
//               style={{ borderTop: "1px solid #ccc" }}
//             >
//               <button
//                 type="button"
//                 className="btn p-2 me-2"
//                 style={{ color: "#075e54" }}
//                 onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//               >
//                 😊
//               </button>
//               <label
//                 className="btn p-2 me-2"
//                 style={{ color: "#075e54" }}
//               >
//                 <Paperclip size={20} />
//                 <input
//                   type="file"
//                   className="d-none"
//                   onChange={handleFileUpload}
//                   accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
//                 />
//               </label>
//               <input
//                 type="text"
//                 value={chatMessage}
//                 onChange={(e) => {
//                   setChatMessage(e.target.value);
//                   handleChatTyping();
//                 }}
//                 placeholder="Type Message"
//                 className="form-control flex-grow-1"
//                 style={{ border: "none", boxShadow: "none" }}
//               />
//               <button
//                 type="button"
//                 className="btn p-2 me-2"
//                 style={{ color: isRecording ? "#ff0000" : "#075e54" }}
//                 onClick={isRecording ? stopRecording : startRecording}
//               >
//                 <Mic size={20} />
//               </button>
//               <button type="submit" className="btn" style={{ backgroundColor: "#800080", color: "#fff" }}>
//                 Send
//               </button>
//             </form>
//             {showEmojiPicker && (
//               <div style={{ position: "absolute", bottom: "60px", right: "20px", zIndex: 1000 }}>
//                 <Picker
//                   onEmojiClick={(emojiObject) => {
//                     setChatMessage((prev) => prev + emojiObject.emoji);
//                     setShowEmojiPicker(false);
//                   }}
//                 />
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="d-flex justify-content-center align-items-center h-100">
//             <p className="text-muted">Select a group to start chatting</p>
//           </div>
//         )}
//       </div>

//       {/* Right Sidebar (Members Panel) */}
//       <div
//         className="bg-light text-dark p-2"
//         style={{ width: "20%", borderLeft: "1px solid #ddd", overflowY: "auto", minHeight: "80vh" }}
//       >
//         <h5 className="mb-3 p-2" style={{ borderBottom: "1px solid #ddd" }}>
//           Members
//         </h5>
//         <ul className="list-unstyled">
//           {joinedUsers.map((user) => {
//             const isActive = activeUsers.some((active) => active.userId === user.userId);
//             console.log(`User: ${user.userName}, Active: ${isActive}`); // Debug log
//             return (
//               <li
//                 key={user.userId}
//                 className="p-1"
//                 style={{ color: isActive ? "#00ff00" : "#000", fontSize: "0.9rem" }}
//               >
//                 {user.userName}
//               </li>
//             );
//           })}
//           {joinedUsers.length === 0 && (
//             <li className="p-1 text-muted" style={{ fontSize: "0.9rem" }}>
//               No members joined.
//             </li>
//           )}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default GroupChat;