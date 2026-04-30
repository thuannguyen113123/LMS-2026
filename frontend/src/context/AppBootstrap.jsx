import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setAppInitialized,
  startAppLoading,
  stopAppLoading,
} from "../features/ui/uiSlice";
import { fetchRelations } from "../features/chat/userRelationsThunks";
import { fetchUserChatRooms } from "../features/chat/chatRoomsThunks";
import { fetchChatRequests } from "../features/chat/chatRequestsThunks";
import { fetchChatNotifications } from "../features/chat/chatNotificationsThunks";
import { fetchMyNotifications } from "../features/notifications/notificationThunks";
import { fetchBookmarks } from "../features/student/studentsThunks";
import { useNotificationSocket } from "./../hooks/Notification/useNotificationSocket";
import { useChatNotificationSocket } from "./../hooks/Chat/Public/useChatNotificationSocket";
import { useCertificateSocket } from "./../hooks/Certificate/Public/useCertificateSocket";

const AppBootstrap = ({ children }) => {
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);
  const initialized = useSelector((s) => s.ui.appInitialized);
  const role = user?.activeRole?.name;

  const bootstrappingRef = useRef(false);

  useNotificationSocket(user);
  useChatNotificationSocket(user);
  useCertificateSocket(user);

  useEffect(() => {
    if (!user?.id || initialized || bootstrappingRef.current) return;

    bootstrappingRef.current = true;

    const bootstrap = async () => {
      dispatch(startAppLoading());

      try {
        const promises = [
          dispatch(fetchUserChatRooms()).unwrap(),
          dispatch(fetchChatRequests()).unwrap(),
          dispatch(fetchChatNotifications()).unwrap(),
          dispatch(fetchMyNotifications()).unwrap(),
          dispatch(fetchRelations()).unwrap(),
        ];

        if (role === "student") {
          promises.push(
            dispatch(fetchBookmarks({ cursor: null, limit: 100 })).unwrap()
          );
        }

        await Promise.all(promises);
      } catch (err) {
        console.error("Bootstrap error:", err);
      } finally {
        dispatch(stopAppLoading());
        dispatch(setAppInitialized(true));
      }
    };

    bootstrap();
  }, [user?.id, initialized, dispatch, role]);

  return children;
};

export default AppBootstrap;
