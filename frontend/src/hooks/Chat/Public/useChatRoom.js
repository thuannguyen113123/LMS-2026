import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "@reduxjs/toolkit";

import { clearRoomMessages } from "../../../features/chat/messagesSlice";
import { fetchRoomMessages } from "../../../features/chat/messagesThunks";
import { selectOtherUserId } from "../../../features/chat/chatRoomsSlice";
import { selectBlockState } from "../../../features/chat/userRelationsSlice";
import { roomRead } from "../../../features/chat/chatNotificationsSlice";
import { useChatSocket } from "./useChatSocket";

export default function useChatRoom() {
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);

  const selectedRoom = useSelector((s) => s.messages.currentRoom);
  const currentRoomId = selectedRoom?._id || selectedRoom?.id;
  const otherUserId = useSelector((state) =>
    selectOtherUserId(state, currentRoomId)
  );

  const { isBlocked, blockedBy } = useSelector(selectBlockState(otherUserId));

  const socket = useChatSocket(user);

  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const typingTimeout = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!currentRoomId) return;

    dispatch(clearRoomMessages(currentRoomId));

    dispatch(fetchRoomMessages({ roomId: currentRoomId }));

    socket.joinRoom(currentRoomId);
    dispatch(roomRead({ roomId: currentRoomId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoomId, dispatch]);

  /* ===================================
     SEND MESSAGE
  =================================== */
  const send = useCallback(
    (content) => {
      if (!content.trim()) return;

      socket.sendMessage(currentRoomId, content, nanoid(), replyingTo?.id);

      setReplyingTo(null);
      setMessage("");
    },
    [socket, currentRoomId, replyingTo]
  );

  const handleTyping = useCallback(() => {
    if (!currentRoomId) return;

    // start typing (only once)
    if (!isTypingRef.current) {
      socket.typingStart(currentRoomId);
      isTypingRef.current = true;
    }

    // reset timeout
    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.typingStop(currentRoomId);
      isTypingRef.current = false;
    }, 2000);
  }, [socket, currentRoomId]);

  /* ===================================
     SEND FILE
  =================================== */
  const sendFile = useCallback(
    async (file) => {
      await socket.handleSendFile(currentRoomId, file);
    },
    [socket, currentRoomId]
  );

  return {
    user,
    selectedRoom,
    currentRoomId,

    isBlocked,
    blockedBy,

    message,
    setMessage,

    replyingTo,
    setReplyingTo,

    send,
    sendFile,
    handleTyping,
    showSidebar,
    setShowSidebar,
    showRightSidebar,
    setShowRightSidebar,

    ...socket,
  };
}
