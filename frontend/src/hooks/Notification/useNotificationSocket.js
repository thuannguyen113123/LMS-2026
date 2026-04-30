import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { useSocketContext } from "../../context/chatSocket.context";
import { addNotification } from "../../features/notifications/notificationSlice";

export const useNotificationSocket = (user) => {
  const { socket } = useSocketContext();
  const dispatch = useDispatch();

  const registeredRef = useRef(false);

  useEffect(() => {
    if (!socket || !user?.id || registeredRef.current) return;

    registeredRef.current = true;

    // CHỈ 1 HANDLER DUY NHẤT
    const handleNewNotification = (payload) => {
      if (!payload || !payload.id) {
        return;
      }

      dispatch(addNotification(payload));
    };

    const handleConnect = () => {
      socket.emit("client:ready");
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("connect", handleConnect);

    // nếu socket đã connected sẵn
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("connect", handleConnect);

      registeredRef.current = false;
    };
  }, [socket, user?.id, dispatch]);
};
