import { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import { getToken } from "../utils/auth";

// Create the context
const SocketContext = createContext(null);

// ─── Provider component ───────────────────────────────────────────────────────
// Wrap your app in this so every component can access the socket
export function SocketProvider({ children }) {
  const [userId, setUserId] = useState(null);

  // Get userId from the JWT token in localStorage
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        // Decode the JWT to get the userId
        // JWT is three base64 parts separated by dots
        // The middle part (index 1) is the payload containing userId
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.id || payload._id || payload.userId);
      } catch {
        setUserId(null);
      }
    }
  }, []);

  const { socket, isConnected, onlineUsers } = useSocket(userId);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, userId }}>
      {children}
    </SocketContext.Provider>
  );
}

// ─── Custom hook to use the socket anywhere ───────────────────────────────────
// Any component just does: const { socket, onlineUsers } = useSocketContext()
export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used inside SocketProvider");
  }
  return context;
}