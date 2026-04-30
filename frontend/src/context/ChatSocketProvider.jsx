import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ChatSocketContext } from "./chatSocket.context";
import { useSelector } from "react-redux";
import { selectAuthToken } from "../features/auth/authSlice";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

export const ChatSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  const token = useSelector(selectAuthToken);
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <ChatSocketContext.Provider value={{ socket, socketRef }}>
      {children}
    </ChatSocketContext.Provider>
  );
};
