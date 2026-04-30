import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSocketContext } from "../../../context/chatSocket.context";
import { notificationReceived } from "../../../features/chat/chatNotificationsSlice";

export const useChatNotificationSocket = (user) => {
  const { socket } = useSocketContext();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleMessageNew = (message) => {
      const roomId = message.roomId?._id || message.roomId;

      const myId = user.id;

      // Chỉ notify nếu message không phải của chính user
      if (message.sender?.id === myId) return;

      dispatch(notificationReceived({ roomId }));
    };

    const register = () => {
      socket.on("message:new", handleMessageNew);
    };

    // CASE 1 — socket đã connect
    if (socket.connected) {
      register();
    }

    //  CASE 2 — chờ connect
    socket.on("connect", register);

    return () => {
      socket.off("connect", register);
      socket.off("message:new", handleMessageNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user?.id]);
};
