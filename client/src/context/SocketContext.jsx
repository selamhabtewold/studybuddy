// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      reconnection: true,
      withCredentials: true,
      transports: ["websocket", "polling"], // Try both WebSocket and polling
      timeout: 20000, // Increase timeout for slower connections
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const value = {
    socket: socketRef.current,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);