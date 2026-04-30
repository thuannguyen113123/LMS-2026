import ChatRoomService from "../services/chat/chatRoom.service.js";
import ChatRequestService from "../services/chatRequest/chatRequest.service.js";
import MessageService from "../services/message/message.service.js";
import { mapMessage } from "../services/message/message.service.js";
import Message from "../models/chat/message.model.js";
import UserBlockService from "../services/userBlock/userBlockService.js";
import UserNotificationService from "../services/userNotification/userNotification.service.js";

import ChatRoom from "../models/chat/chatRoom.model.js";

import { PresenceStore } from "./presence.store.js";
import { ReadyStore } from "./socketReady.store.js";

async function emitPresenceToContacts(io, userId, status) {
  // lấy tất cả room user thuộc về
  const rooms = await ChatRoom.find({ user_ids: userId })
    .select("user_ids")
    .lean();

  const notified = new Set();

  for (const room of rooms) {
    for (const memberId of room.user_ids) {
      const id = memberId.toString();

      if (id === userId.toString()) continue;
      if (notified.has(id)) continue;

      notified.add(id);

      io.to("user:" + id).emit("presence:update", {
        userId,
        status,
      });
    }
  }
}
export default async function registerChatHandlers(io, socket) {
  const userId = socket.user.id;

  socket.join("user:" + userId);

  const rooms = await ChatRoom.find({ user_ids: userId }).select("_id").lean();
  await Promise.all(rooms.map((r) => socket.join(r._id.toString())));

  socket.emit("server:connected");

  socket.on("client:ready", () => {
    ReadyStore.add(userId);
    console.log("✅ CLIENT READY:", userId);

    socket.emit("server:ready");
  });

  // ADD ONLINE
  PresenceStore.add(userId, socket.id);
  socket.emit("presence:initial", {
    onlineUsers: PresenceStore.getAllOnline(),
  });
  await emitPresenceToContacts(io, userId, "online");

  socket.on("disconnect", async () => {
    PresenceStore.remove(userId, socket.id);
    ReadyStore.remove(userId);

    if (!PresenceStore.isOnline(userId)) {
      await emitPresenceToContacts(io, userId, "offline");
    }
  });
  socket.on("room:join", async ({ roomId }) => {
    try {
      // 1. check DB permission
      await ChatRoomService.assertUserInRoom(roomId, socket.user.id);
      // 2. join socket room
      socket.join(roomId);
      socket.emit("room:joined", { roomId });
    } catch (err) {
      console.log("JOIN ERROR", err.code);

      socket.emit("error", err.code || "JOIN_FAILED");
    }
  });
  socket.on("chat:request:send", async ({ toUserId }) => {
    try {
      const result = await ChatRequestService.sendRequest({
        fromUserId: socket.user.id,
        toUserId,
      });

      // emit cho receiver
      io.to("user:" + toUserId).emit("chat:request:new", result);

      // emit lại cho sender (update UI)
      socket.emit("chat:request:sent", result);
    } catch (err) {
      socket.emit("chat:error", {
        code: err.message || "REQUEST_FAILED",
      });
    }
  });

  socket.on("chat:request:accept", async ({ requestId }) => {
    try {
      const result = await ChatRequestService.acceptRequest(
        requestId,
        socket.user.id
      );

      const { room, message } = result;

      // emit cho cả 2 user tạo room
      room.user_ids.forEach((id) => {
        const userId = id.toString();

        io.to("user:" + userId).emit("room:new", room);
        io.to("user:" + userId).emit("chat:request:accepted", {
          requestId,
          room,
          message,
        });
      });
    } catch (err) {
      socket.emit("chat:error", {
        code: err.message || "ACCEPT_FAILED",
      });
    }
  });
  socket.on("chat:request:reject", async ({ requestId }) => {
    const result = await ChatRequestService.rejectRequest(
      requestId,
      socket.user.id
    );

    const { fromUserId, toUserId } = result;

    [fromUserId, toUserId].forEach((uid) => {
      io.to("user:" + uid).emit("chat:request:rejected", {
        requestId,
      });
    });
  });

  socket.on("message:react", async ({ messageId, reaction }) => {
    try {
      const reactions = await MessageService.addReaction(
        messageId,
        socket.user.id,
        reaction
      );
      const message = await Message.findById(messageId)
        .populate("senderId", "name avatar")
        .lean();

      const mapped = mapMessage(message);

      io.to(mapped.roomId).emit("message:reaction:update", {
        messageId: mapped.id,
        roomId: mapped.roomId,
        reactions: mapped.reactions,
      });
    } catch (err) {
      socket.emit("chat:error", {
        code: err.message || "REACTION_FAILED",
      });
    }
  });
  socket.on("room:leave", ({ roomId }) => {
    socket.leave(roomId);
  });

  socket.on("notification:read-room", async ({ roomId }) => {
    const result = await UserNotificationService.markAsRead({
      roomId,
      userId: socket.user.id,
    });

    io.to("user:" + socket.user.id).emit("notification:read-room", {
      roomId: result.roomId,
      userId: socket.user.id,
      lastReadMessageId: result.lastReadMessageId,
    });
  });

  socket.onAny((event, ...args) => {
    console.log("🔍 SOCKET EVENT:", event, args);
  });

  socket.on("typing:start", async ({ roomId }) => {
    const room = await ChatRoom.findById(roomId).select("user_ids");

    if (!room) return;

    const receiver = room.user_ids.find(
      (id) => id.toString() !== socket.user.id.toString()
    );

    if (!receiver) return;

    const blocked = await UserBlockService.isBlockedBetween(
      socket.user.id,
      receiver
    );

    if (blocked) return;

    socket.to(roomId).emit("typing:start", {
      roomId,
      userId: socket.user.id,
      name: socket.user.name,
    });
  });
  socket.on("typing:stop", async ({ roomId }) => {
    const room = await ChatRoom.findById(roomId).select("user_ids");

    if (!room) return;

    const receiver = room.user_ids.find(
      (id) => id.toString() !== socket.user.id.toString()
    );

    if (!receiver) return;

    const blocked = await UserBlockService.isBlockedBetween(
      socket.user.id,
      receiver
    );

    if (blocked) return;

    socket.to(roomId).emit("typing:stop", {
      roomId,
      userId: socket.user.id,
    });
  });
}
