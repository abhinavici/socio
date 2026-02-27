import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// The backend URL where Socket.io is running
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") 
  || "http://localhost:5000";

// ─── useSocket hook ───────────────────────────────────────────────────────────
// Pass in the logged-in userId to connect and join their personal room
// Returns: { socket, onlineUsers, isConnected }
export function useSocket(userId) {
  // useRef stores the socket instance without causing re-renders
  // unlike useState, changing a ref doesn't re-render the component
  const socketRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Don't connect if we don't have a userId (not logged in)
    if (!userId) return;

    // ── Create socket connection ──────────────────────────────────────────
    // autoConnect: true means it connects immediately
    // reconnection: true means it auto-reconnects if connection drops
    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,    // wait 1s before trying to reconnect
      reconnectionAttempts: 5,    // try 5 times before giving up
    });

    const socket = socketRef.current;

    // ── Tell server who we are once connected ─────────────────────────────
    // This joins our personal room on the server
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      // Emit our userId so server adds us to onlineUsers map
      socket.emit("userOnline", userId);
    });

    // ── Handle disconnection ──────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    // ── Receive online users list from server ─────────────────────────────
    // Server emits this whenever someone connects or disconnects
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // ── Cleanup function ──────────────────────────────────────────────────
    // This runs when component unmounts OR userId changes
    // Very important — without this you'd have multiple sockets open
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId]); // Re-run if userId changes (login/logout)

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
  };
}