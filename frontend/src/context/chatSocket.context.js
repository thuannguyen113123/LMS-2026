import { createContext, useContext } from "react";

export const ChatSocketContext = createContext(null);

export const useSocketContext = () => {
  const context = useContext(ChatSocketContext);

  if (!context) {
    throw new Error("useSocketContext must be used inside ChatSocketProvider");
  }

  return context;
};
