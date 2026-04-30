import { Server } from "socket.io";
import registerChatHandlers from "./chatSocket.js";
import ChatRoomService from "../services/chat/chatRoom.service.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const userId = socket.user?.id;

    if (!userId) {
      return;
    }

    try {
      socket.join("user:" + userId);

      const rooms = await ChatRoomService.getUserRooms(userId);

      rooms.forEach((room) => {
        const roomId = room.id.toString();
        socket.join(roomId);
      });
    } catch (err) {
      console.error("Join rooms error:", err);
    }

    registerChatHandlers(io, socket);
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io chưa được init");
  }
  return io;
};
