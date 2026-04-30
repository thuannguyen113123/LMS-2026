import { useEffect } from "react";
import { useDispatch } from "react-redux";

import {
  createMessage,
  deleteMessage,
} from "../../../features/chat/messagesThunks";
import { uploadToCloudinary } from "../../../config/uploadToCloudinary";
import { updateAttachmentProgress } from "../../../features/chat/messagesSlice";
import {
  addMessageFromSocket,
  removeMessageFromSocket,
  updateMessageFromSocket,
  setUserTyping,
  removeUserTyping,
} from "../../../features/chat/messagesSlice";
import { store } from "./../../../store/store";
import {
  addRoomFromSocket,
  setInitialPresence,
  setUserPresence,
  // syncUnreadFromNotifications,
  updateRoomFromMessage,
} from "../../../features/chat/chatRoomsSlice";
import {
  addIncomingRequest,
  addOutgoingRequest,
  removeRequest,
} from "../../../features/chat/chatRequestsSlice";
import { useSocketContext } from "../../../context/chatSocket.context";
import Toast from "../../../components/toast/Toast";
import { syncBlockState } from "../../../features/chat/userRelationsSlice";
import {
  blockUser,
  unblockUser,
} from "../../../features/chat/userRelationsThunks";
import { fetchUserChatRooms } from "../../../features/chat/chatRoomsThunks";
import { roomRead } from "../../../features/chat/chatNotificationsSlice";
import { fetchChatNotifications } from "../../../features/chat/chatNotificationsThunks";

export const useChatSocket = (user) => {
  const { socket } = useSocketContext();

  const emitWhenConnected = (event, payload) => {
    if (!socket) return;

    if (socket.connected) {
      console.log("✅ EMIT NOW:", event, payload);
      socket.emit(event, payload);
    } else {
      console.log("⏳ WAIT CONNECT → EMIT:", event);

      socket.once("connect", () => {
        console.log("✅ CONNECTED → EMIT:", event);
        socket.emit(event, payload);
      });
    }
  };
  const dispatch = useDispatch();

  const getOtherUserId = () => {
    const state = store.getState();
    const room = state.messages.currentRoom;
    const myId = state.auth.user?.id;

    if (!room?.members) return null;

    const other = room.members.find((m) => m.userId !== myId);

    return other?.userId || null;
  };
  useEffect(() => {
    if (!socket || !user?.id) return;

    console.log("✅ REGISTER SOCKET LISTENERS");

    // ================= READY =================
    const handleSocketReady = async () => {
      console.log("🚀 SOCKET READY → FETCH ROOMS");

      await dispatch(fetchUserChatRooms());
    };

    // ================= HANDLERS =================

    const handleNewRequest = (payload) => {
      dispatch(addIncomingRequest(payload.request));
    };
    const handleRequestSent = (payload) => {
      dispatch(addOutgoingRequest(payload.request));
    };
    const handleMessageNew = (rawMessage) => {
      let message = { ...rawMessage };

      if (message.replyTo?._id) {
        message.replyTo = {
          id: message.replyTo._id,
          content: message.replyTo.content,
          senderName: message.replyTo.senderId?.name,
        };
      } else {
        message.replyTo = null;
      }

      const state = store.getState();
      const currentRoom = state.messages.currentRoom;
      const currentRoomId = currentRoom?._id || currentRoom?.id;
      const entities = state.messages.entities;

      const msgRoomId = message.roomId?._id || message.roomId;

      store.dispatch(
        updateRoomFromMessage({
          message,
        })
      );

      if (msgRoomId !== currentRoomId) {
        // store.dispatch(notificationReceived({ roomId: msgRoomId }));

        return;
      }

      if (message.clientTempId) {
        const optimistic = Object.values(entities).find(
          (m) => m.clientTempId === message.clientTempId
        );

        if (optimistic) {
          store.dispatch(removeMessageFromSocket(optimistic.id));

          store.dispatch(
            addMessageFromSocket({
              ...message,
              optimistic: false,
              status: "sent",
            })
          );
          return;
        }
      }

      if (entities[message.id]) return;

      store.dispatch(
        addMessageFromSocket({
          ...message,
          optimistic: false,
          status: "sent",
        })
      );
    };

    const handleTypingStart = (data) => {
      const relation = store.getState().userRelations.relations[data.userId];
      if (relation?.isBlocked) return;
      dispatch(setUserTyping(data));
    };

    const handleTypingStop = (data) => {
      const relation = store.getState().userRelations.relations[data.userId];
      if (relation?.isBlocked) return;
      dispatch(removeUserTyping(data));
    };

    const handlePresenceUpdate = (data) => {
      dispatch(setUserPresence(data));
    };

    const handleInitialPresence = ({ onlineUsers }) => {
      dispatch(setInitialPresence(onlineUsers));
    };

    const handleReactionUpdate = (payload) => {
      dispatch(
        updateMessageFromSocket({
          id: payload.messageId,
          changes: { reactions: payload.reactions },
        })
      );
    };

    const handleRecalled = (message) => {
      dispatch(
        updateMessageFromSocket({
          id: message.id,
          changes: message,
        })
      );
    };

    const handleRoomRead = (data) => {
      console.log("🔥 ROOM READ RECEIVED", data);
      dispatch({
        type: "chatNotifications/roomReadRemote",
        payload: data,
      });
    };

    const handleNewRoom = (room) => {
      dispatch(addRoomFromSocket(room));
    };

    const handleAccepted = ({ requestId, room, message }) => {
      dispatch(removeRequest(requestId));

      dispatch(addRoomFromSocket(room));
      Toast.success(message || "Đã bắt đầu cuộc trò chuyện");
    };
    const handleRejected = ({ requestId }) => {
      dispatch(removeRequest(requestId));
    };

    const handleBlockUpdate = (payload) => {
      dispatch(
        syncBlockState({
          ...payload,
          myId: user.id,
        })
      );
    };
    // ================= BIND =================

    const register = () => {
      console.log("✅ REGISTER CHAT SOCKET LISTENERS");

      // ❗ remove trước khi add lại (anti-duplicate)
      socket.off("server:connected", handleSocketReady);
      socket.off("chat:request:new", handleNewRequest);
      socket.off("chat:request:sent", handleRequestSent);
      socket.off("message:new", handleMessageNew);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("presence:initial", handleInitialPresence);
      socket.off("message:reaction:update", handleReactionUpdate);
      socket.off("message:recalled", handleRecalled);
      socket.off("notification:read-room", handleRoomRead);
      socket.off("room:new", handleNewRoom);
      socket.off("chat:request:accepted", handleAccepted);
      socket.off("user:block:update", handleBlockUpdate);
      socket.off("chat:request:rejected", handleRejected);

      // ✅ rồi mới on lại
      socket.on("server:connected", handleSocketReady);
      socket.on("chat:request:new", handleNewRequest);
      socket.on("chat:request:sent", handleRequestSent);
      socket.on("message:new", handleMessageNew);
      socket.on("typing:start", handleTypingStart);
      socket.on("typing:stop", handleTypingStop);
      socket.on("presence:update", handlePresenceUpdate);
      socket.on("presence:initial", handleInitialPresence);
      socket.on("message:reaction:update", handleReactionUpdate);
      socket.on("message:recalled", handleRecalled);
      socket.on("notification:read-room", handleRoomRead);
      socket.on("room:new", handleNewRoom);
      socket.on("chat:request:accepted", handleAccepted);
      socket.on("chat:request:rejected", handleRejected);
      socket.on("user:block:update", handleBlockUpdate);
    };

    if (socket.connected) {
      register();
    }

    const handleConnect = () => {
      console.log("📡 CONNECTED → REGISTER + READY");

      register();
      socket.emit("client:ready");
    };

    socket.on("connect", handleConnect);

    // ================= CLEANUP =================
    return () => {
      console.log("🧹 REMOVE SOCKET LISTENERS");

      socket.off("connect", handleConnect);

      socket.off("server:connected", handleSocketReady);
      socket.off("chat:request:new", handleNewRequest);
      socket.off("chat:request:sent", handleRequestSent);
      socket.off("message:new", handleMessageNew);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("presence:initial", handleInitialPresence);
      socket.off("message:reaction:update", handleReactionUpdate);
      socket.off("message:recalled", handleRecalled);
      socket.off("notification:read-room", handleRoomRead);
      socket.off("room:new", handleNewRoom);
      socket.off("chat:request:accepted", handleAccepted);
      socket.off("chat:request:rejected", handleRejected);
      socket.off("user:block:update", handleBlockUpdate);
      socket.off("connect", handleConnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user?.id]);

  //  FETCH NOTIFICATION LẦN ĐẦU

  useEffect(() => {
    if (!user?.id) return;

    dispatch(fetchChatNotifications());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const typingStart = (roomId) => {
    emitWhenConnected("typing:start", { roomId });
  };

  const typingStop = (roomId) => {
    emitWhenConnected("typing:stop", { roomId });
  };

  const joinRoom = async (roomId) => {
    emitWhenConnected("room:join", { roomId });
  };

  const leaveRoom = (roomId) => {
    emitWhenConnected("room:leave", { roomId });
  };

  const sendMessage = async (
    roomId,
    content,
    tempId,
    replyTo = null,
    attachments = []
  ) => {
    const otherUserId = getOtherUserId();

    if (otherUserId) {
      const relation = store.getState().userRelations.relations[otherUserId];

      if (relation?.isBlocked) {
        Toast.error("Không thể gửi tin nhắn");
        return;
      }
    }
    // Optimistic UI
    dispatch(
      addMessageFromSocket({
        id: tempId,
        roomId,
        clientTempId: tempId,

        // ⭐ OPTIMISTIC REPLY FIX
        replyTo: replyTo
          ? {
              id: replyTo.id || replyTo,
              content: replyTo.content || "(đang gửi...)",
              senderName: replyTo.sender?.name || replyTo.senderName || "",
            }
          : null,

        sender: {
          id: user.id,
          avatar: user.avatar,
          name: user.name,
        },

        content,
        attachments,
        createdAt: new Date().toISOString(),
        optimistic: true,
        status: "sending",
      })
    );

    // API → Service → Socket emit từ server
    await dispatch(
      createMessage({
        roomId,
        content,
        replyTo,
        attachments,
        clientTempId: tempId,
      })
    ).unwrap();
  };

  const recallMessage = async (messageId) => {
    // optimistic
    dispatch(
      updateMessageFromSocket({
        id: messageId,
        changes: {
          metadata: {
            deleted: true,
          },
          optimistic: true,
        },
      })
    );

    try {
      await dispatch(deleteMessage(messageId)).unwrap();
    } catch (e) {
      console.log(e);

      // rollback nếu fail
      dispatch(
        updateMessageFromSocket({
          id: messageId,
          changes: {
            metadata: {
              deleted: false,
            },
            optimistic: false,
          },
        })
      );
    }
  };

  const reactMessage = async (messageId, reaction) => {
    const state = store.getState();
    const message = state.messages.entities[messageId];

    const myId = user.id;

    const existing = message.reactions?.find((r) => r.userId === myId);

    let newReactions;

    // 👉 CASE 1: same → UNREACT
    if (existing && existing.reaction === reaction) {
      newReactions = message.reactions.filter((r) => r.userId !== myId);
    }
    // 👉 CASE 2: khác → UPDATE
    else if (existing) {
      newReactions = message.reactions.map((r) =>
        r.userId === myId ? { ...r, reaction } : r
      );
    }
    // 👉 CASE 3: chưa có → ADD
    else {
      newReactions = [...(message.reactions || []), { userId: myId, reaction }];
    }

    dispatch(
      updateMessageFromSocket({
        id: messageId,
        changes: {
          reactions: newReactions,
        },
      })
    );

    emitWhenConnected("message:react", { messageId, reaction });
  };
  const markAsRead = (roomId) => {
    dispatch(roomRead({ roomId })); // optimistic

    emitWhenConnected("notification:read-room", { roomId });
  };

  const handleSendFile = async (roomId, file) => {
    console.log("handleSendFile args:", roomId, file);
    if (!(file instanceof File)) {
      console.error("Invalid file:", file);
      return;
    }
    const tempId = crypto.randomUUID();

    const preview = URL.createObjectURL(file);

    // STEP 1 — optimistic message
    dispatch(
      addMessageFromSocket({
        id: tempId,
        roomId,
        clientTempId: tempId,
        sender: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        content: "",
        attachments: [
          {
            type: file.type.startsWith("image")
              ? "image"
              : file.type.startsWith("video")
              ? "video"
              : "file",
            filename: file.name,
            localPreview: preview,
            uploading: true,
            progress: 0,
          },
        ],
        createdAt: new Date().toISOString(),
        optimistic: true,
        status: "sending",
      })
    );

    try {
      // STEP 2 — upload background
      const result = await uploadToCloudinary(file, (progress) => {
        dispatch(
          updateAttachmentProgress({
            messageId: tempId,
            progress,
          })
        );
      });

      const attachment = {
        type: result.resource_type,
        url: result.optimized_url,
        filename: result.original_filename,
        size: result.bytes,
        uploading: false,
      };

      // STEP 3 — replace attachment preview
      dispatch(
        updateMessageFromSocket({
          id: tempId,
          changes: {
            attachments: [attachment],
          },
        })
      );

      // STEP 4 — send real message
      await dispatch(
        createMessage({
          roomId,
          content: "",
          attachments: [attachment],
          clientTempId: tempId,
        })
      );
    } catch (err) {
      console.error(err);

      dispatch(
        updateMessageFromSocket({
          id: tempId,
          changes: {
            attachments: [
              {
                localPreview: preview,
                failed: true,
              },
            ],
          },
        })
      );
    }
  };
  const blockUserAction = async (otherUserId) => {
    const state = store.getState();

    const relation = state.userRelations.blockedUsers?.[otherUserId];

    if (relation?.blockedBy === "me") return; // 🚫 already blocked

    await dispatch(blockUser(otherUserId)).unwrap();
  };

  const unblockUserAction = async (otherUserId) => {
    await dispatch(unblockUser(otherUserId)).unwrap();
  };

  // ======================================================
  return {
    socket,
    joinRoom,
    leaveRoom,
    sendMessage,
    recallMessage,
    reactMessage,
    markAsRead,
    handleSendFile,
    blockUserAction,
    unblockUserAction,

    typingStart,
    typingStop,
  };
};
