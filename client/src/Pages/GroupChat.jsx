import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap is included
import Picker from "emoji-picker-react"; // Install: npm install emoji-picker-react
import { Mic, Paperclip } from "react-feather"; // Install: npm install react-feather
import axios from "axios"; // Install: npm install axios for file uploads

const GroupChat = () => {
  const { groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { groupName, userId, userName } = location.state || {};
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage on mount
    const savedMessages = localStorage.getItem(`chat_${groupId}_${userId}`);
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [message, setMessage] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [isTyping, setIsTyping] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Memoize sendMessage to prevent duplicate emissions
  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!userId || !groupId || !userName) {
        console.error("Cannot send message: Missing userId, groupId, or userName");
        alert("You must be logged in and have a valid group to send messages. Redirecting to login...");
        navigate("/login");
        return;
      }
      if (message.trim() || audioBlob) {
        const messageData = {
          userId,
          groupId,
          userName,
          timestamp: new Date().toISOString(),
          messageId: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
        };

        if (message.trim()) {
          // Emit the message to the server
          console.log("Sending message:", messageData);
          socket?.emit("sendGroupMessage", { ...messageData, message: message.trim() });
        }

        if (audioBlob) {
          try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "voice-note.mp3");
            formData.append("userId", userId);
            formData.append("groupId", groupId);
            formData.append("userName", userName);

            const response = await axios.post(
              "http://localhost:5000/api/study-groups/send-audio",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
              }
            );

            const audioData = response.data;
            messageData.audioUrl = audioData.audioUrl; // URL from server response
            messageData.messageId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // New unique ID
            console.log("Sending audio message:", messageData);
            socket?.emit("sendGroupMessage", messageData);
          } catch (error) {
            console.error("Error uploading voice note:", error);
            alert("Failed to send voice note. Please try again.");
          }
          setAudioBlob(null); // Clear after sending
        }

        setMessage(""); // Clear text input after sending
      }
    },
    [message, userId, groupId, userName, socket, navigate, audioBlob]
  );

  useEffect(() => {
    if (!groupId) {
      console.error("Missing groupId in URL parameters");
      alert("Invalid group. Redirecting to home...");
      navigate("/yourbuddy");
      return;
    }

    const fetchUserData = async () => {
      const token = localStorage.getItem("authToken");
      if (!userId && token) {
        try {
          const response = await fetch("http://localhost:5000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch user details");
          const userData = await response.json();
          if (userData._id) {
            setUserId(userData._id);
            setUserName(userData.name || "Anonymous");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUserName("Anonymous");
          alert("Failed to fetch user details. Please log in again.");
          navigate("/login");
        }
      } else if (!userId) {
        alert("Please log in to join the chat.");
        navigate("/login");
        return;
      }
    };

    const fetchGroupData = async () => {
      const token = localStorage.getItem("authToken");
      if (!groupName && token) {
        try {
          const response = await fetch(`http://localhost:5000/api/study-groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch group details");
          const groupData = await response.json();
          setMemberCount(groupData.membersCount || 0);
          if (groupData.name) setGroupName(groupData.name);
        } catch (err) {
          console.error("Error fetching group data:", err);
          setGroupName("Unknown Group");
        }
      }
    };

    const fetchChatHistory = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const response = await fetch(`http://localhost:5000/api/study-groups/${groupId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch chat history");
          const chatHistory = await response.json();
          setMessages((prev) => {
            const uniqueMessages = [...prev, ...chatHistory].filter((msg, index, self) =>
              index === self.findIndex((m) => m.messageId === msg.messageId)
            );
            localStorage.setItem(`chat_${groupId}_${userId}`, JSON.stringify(uniqueMessages));
            return uniqueMessages;
          });
        } catch (err) {
          console.error("Error fetching chat history:", err);
        }
      }
    };

    const newSocket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      cors: {
        origin: "http://localhost:5173", // Match Vite's port
        credentials: true,
      },
    });
    setSocket(newSocket);

    const effectiveUserId = userId || (localStorage.getItem("authToken") ? "anonymous" : null);
    if (effectiveUserId) {
      console.log(`Joining group chat for user ${effectiveUserId} in group ${groupId}`);
      newSocket.emit("joinGroupChat", { userId: effectiveUserId, groupId });
    } else {
      console.error("Cannot join chat: No userId available");
      alert("Please log in to join the chat.");
      navigate("/login");
      return;
    }

    fetchUserData();
    fetchGroupData();
    fetchChatHistory();

    newSocket.on("receiveGroupMessage", (messageData) => {
      console.log("Received message:", messageData);
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) =>
            msg.messageId === messageData.messageId &&
            msg.userId === messageData.userId
        );
        if (!isDuplicate) {
          const updatedMessages = [...prev, messageData];
          localStorage.setItem(`chat_${groupId}_${userId}`, JSON.stringify(updatedMessages));
          return updatedMessages;
        }
        return prev; // Prevent duplicate if already exists
      });
    });

    newSocket.on("memberCountUpdated", (data) => {
      if (data.groupId === groupId) {
        console.log("Member count updated:", data.membersCount);
        setMemberCount(data.membersCount || 0);
      }
    });

    newSocket.on("typing", ({ userId: typingUserId, groupId: typingGroupId }) => {
      if (typingGroupId === groupId && typingUserId !== effectiveUserId) {
        console.log(`User ${typingUserId} is typing in group ${groupId}`);
        setIsTyping((prev) => ({ ...prev, [typingUserId]: true }));
        setTimeout(() => setIsTyping((prev) => ({ ...prev, [typingUserId]: false })), 2000);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        console.log("Socket manually disconnected from GroupChat");
      }
    };
  }, [groupId, navigate]);

  const handleTyping = useCallback(() => {
    if (socket && message.length > 0 && userId) {
      console.log(`Emitting typing for user ${userId} in group ${groupId}`);
      socket.emit("typing", { userId, groupId });
    }
  }, [socket, message, userId, groupId]);

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Ensure microphone permissions are granted.");
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
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        formData.append("groupId", groupId);
        formData.append("userName", userName);

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
          userId,
          groupId,
          userName,
          fileUrl: fileData.fileUrl, // URL from server response
          timestamp: new Date().toISOString(),
          messageId: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
        };
        console.log("Sending file message:", messageData);
        socket?.emit("sendGroupMessage", messageData);
        setMessages((prev) => {
          const isDuplicate = prev.some((msg) => msg.messageId === messageData.messageId);
          if (!isDuplicate) {
            const updatedMessages = [...prev, { ...messageData }];
            localStorage.setItem(`chat_${groupId}_${userId}`, JSON.stringify(updatedMessages));
            return updatedMessages;
          }
          return prev; // Prevent duplicate if already exists
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to send file. Please try again.");
      }
    }
  };

  // Scroll to the bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="min-vh-100 d-flex flex-column p-4"
      style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
      aria-label="Group Chat Interface"
    >
      {/* Header with Group Name, Member Count, and Typing Status */}
      <div className="text-center mb-4">
        <h2 className="fw-bold mb-2" style={{ color: "#d426ff" }}>
          {groupName || "Unknown Group"}
        </h2>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          Members: {memberCount}
        </p>
        {Object.entries(isTyping).some(([typingUserId, typing]) => typing && typingUserId !== userId) && (
          <p className="text-muted text-center" style={{ fontSize: "0.9rem" }} aria-live="polite">
            Someone is typing...
          </p>
        )}
      </div>

      {/* Messages Container with Modern Design */}
      <div
        className="flex-grow-1 mb-3 p-3 rounded-lg shadow-lg"
        style={{
          backgroundColor: "#2d2d2d",
          border: "1px solid rgba(212, 38, 255, 0.2)",
          maxHeight: "65vh",
          overflowY: "auto",
          transition: "all 0.3s ease",
        }}
        aria-live="polite"
        aria-label="Chat Messages"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 ${msg.userId === userId ? "text-end" : "text-start"}`}
          >
            <span
              className={`d-inline-block p-2 rounded-lg ${msg.userId === userId ? "bg-purple-600" : "bg-gray-700"}`}
              style={{
                maxWidth: "75%",
                animation: "fadeIn 0.5s ease-in-out",
              }}
              aria-label={`Message from ${msg.userName || "Unknown"}`}
            >
              <strong style={{ color: msg.userId === userId ? "#ffffff" : "#e5e7eb" }}>
                {msg.userName || (msg.userId === userId ? "You" : "Member")}
              </strong>
              {msg.message && `: ${msg.message}`}
              {msg.audioUrl && (
                <audio controls className="mt-2">
                  <source src={msg.audioUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
              )}
              {msg.fileUrl && (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-block mt-2 text-decoration-none text-white"
                  style={{ color: "#d426ff" }}
                >
                  View File: {msg.fileUrl.split("/").pop()}
                </a>
              )}
              <br />
              <small style={{ color: "#aaaaaa", fontSize: "0.7rem" }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </small>
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form with Modern Design and Additional Controls */}
      <div className="d-flex flex-column gap-2">
        <div className="d-flex gap-2 align-items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message or add an emoji..."
            className="form-control flex-grow-1"
            style={{
              backgroundColor: "#3c3f4c",
              color: "#ffffff",
              border: "1px solid rgba(212, 38, 255, 0.2)",
              borderRadius: "12px",
              padding: "10px 15px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
            onKeyDown={handleTyping}
            aria-label="Message Input"
            disabled={!userId}
          />
          <button
            type="button"
            className="btn p-2"
            style={{
              backgroundColor: "#3c3f4c",
              color: "#ffffff",
              borderRadius: "12px",
              border: "1px solid rgba(212, 38, 255, 0.2)",
              transition: "background 0.3s ease-in-out",
            }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={!userId}
            aria-label="Open Emoji Picker"
          >
            😊
          </button>
          <label
            className="btn p-2"
            style={{
              backgroundColor: "#3c3f4c",
              color: "#ffffff",
              borderRadius: "12px",
              border: "1px solid rgba(212, 38, 255, 0.2)",
              cursor: "pointer",
              transition: "background 0.3s ease-in-out",
            }}
            disabled={!userId}
          >
            <Paperclip size={20} />
            <input
              type="file"
              className="d-none"
              onChange={handleFileUpload}
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              aria-label="Upload File"
            />
          </label>
          <button
            type="button"
            className="btn p-2"
            style={{
              backgroundColor: isRecording ? "#ff4444" : "#3c3f4c",
              color: "#ffffff",
              borderRadius: "12px",
              border: "1px solid rgba(212, 38, 255, 0.2)",
              transition: "background 0.3s ease-in-out",
            }}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!userId}
            aria-label={isRecording ? "Stop Recording" : "Start Recording Voice Note"}
          >
            <Mic size={20} />
          </button>
          <button
            type="submit"
            className="btn fw-bold px-4 py-2 shadow-sm"
            style={{
              backgroundColor: "#d426ff",
              color: "white",
              borderRadius: "12px",
              transition: "background 0.3s ease-in-out, transform 0.2s ease",
              border: "none",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#b31cff";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#d426ff";
              e.target.style.transform = "scale(1)";
            }}
            disabled={!userId}
            aria-label="Send Message"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="position-absolute" style={{ bottom: "60px", right: "20px", zIndex: 1000 }}>
            <Picker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .bg-purple-600 { background-color: #d426ff !important; }
          .bg-gray-700 { background-color: #3c3f4c !important; }
        `}
      </style>
    </div>
  );
};

export default GroupChat;