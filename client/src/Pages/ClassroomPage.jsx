import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import SimplePeer from "simple-peer";

const ClassroomPage = () => {
  const { classroomId } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [error, setError] = useState(null);
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const userVideo = useRef();
  const peersRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || null;
  const token = localStorage.getItem("authToken");
  const { socket } = useSocket();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!socket) return;

    socket.on("connect", () => {
      console.log("Connected to classroom WebSocket");
      socket.emit("userLoggedIn", user.id.toString());
      socket.emit("joinClassroom", { classroomId, userId: user.id.toString() });
    });

    const fetchClassroom = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/classrooms/${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setClassroom(data);
        } else {
          throw new Error(data.message || "Failed to fetch classroom");
        }
      } catch (error) {
        console.error("Error fetching classroom:", error);
        setError(error.message);
      }
    };

    fetchClassroom();

    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        stream = mediaStream;
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        socket.on("allUsers", (users) => {
          const peers = [];
          users.forEach((userId) => {
            const peer = createPeer(userId.toString(), socket.id, stream);
            if (peer) {
              peersRef.current.push({
                peerID: userId.toString(),
                peer,
              });
              peers.push(peer);
            }
          });
          setPeers(peers);
        });

        socket.on("userJoined", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID.toString(), stream);
          if (peer) {
            peersRef.current.push({
              peerID: payload.callerID.toString(),
              peer,
            });
            setPeers((prev) => [...prev, peer]);
          }
        });

        socket.on("receivingReturnedSignal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id.toString());
          if (item) item.peer.signal(payload.signal);
        });

        socket.on("chatMessage", (message) => {
          setMessages((prev) => [...prev, message]);
        });
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        setError("Failed to access camera/microphone. Please check permissions or try again.");
      });

    socket.on("classroomEnded", () => {
      navigate("/dashboard");
      setPeers([]);
      setMessages([]);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [classroomId, token, navigate, user, socket]);

  const createPeer = (userToSignal, callerID, stream) => {
    try {
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal) => {
        socket.emit("sendingSignal", {
          userToSignal,
          callerID,
          signal,
        });
      });

      peer.on("stream", (stream) => {
        setPeers((prev) => [...prev, stream]);
      });

      peer.on("error", (err) => console.error("Peer error:", err));

      return peer;
    } catch (error) {
      console.error("Error creating peer:", error);
      setError("Failed to initialize video connection. Please try again.");
      return null;
    }
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    try {
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal) => {
        socket.emit("returningSignal", { signal, callerID });
      });

      peer.on("stream", (stream) => {
        setPeers((prev) => [...prev, stream]);
      });

      peer.on("error", (err) => console.error("Peer error:", err));

      peer.signal(incomingSignal);

      return peer;
    } catch (error) {
      console.error("Error adding peer:", error);
      setError("Failed to connect to another user. Please try again.");
      return null;
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit("chatMessage", {
        classroomId,
        userId: user.id.toString(),
        userName: user.name,
        message: newMessage,
      });
      setNewMessage("");
    }
  };

  if (!token) {
    return <p className="text-center mt-5">Please log in to join the classroom.</p>;
  }

  if (error) {
    return (
      <div className="text-danger text-center mt-4">
        Error: {error}
        <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!classroom) {
    return <p className="text-center mt-5">Loading classroom...</p>;
  }

  return (
    <div className="container mt-4">
      <div className="card p-4 shadow-lg">
        <h2 className="card-title text-center mb-4">Classroom: {classroom.name}</h2>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <video ref={userVideo} autoPlay playsInline muted className="w-100 mb-3" />
              {peers.map((peer, index) => (
                <video
                  key={index}
                  autoPlay
                  playsInline
                  className="w-100 mb-3"
                  ref={(video) => video && (video.srcObject = peer)}
                />
              ))}
            </div>
            <div className="col-md-4">
              <h4>Chat</h4>
              <div className="chat-box" style={{ height: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
                {messages.map((msg, index) => (
                  <div key={index} className={msg.userId === user.id.toString() ? "text-right" : "text-left"}>
                    <small>{msg.userName}: </small>
                    <span className="badge badge-light">{msg.message}</span>
                    <br />
                    <small className="text-muted">{new Date(msg.timestamp).toLocaleTimeString()}</small>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button type="submit" className="btn btn-primary">
                  Send
                </button>
              </form>
            </div>
          </div>
          <button
            className="btn btn-danger mt-3 w-100"
            onClick={() => {
              navigate("/dashboard");
              if (socket) socket.disconnect();
            }}
          >
            Leave Classroom
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassroomPage;