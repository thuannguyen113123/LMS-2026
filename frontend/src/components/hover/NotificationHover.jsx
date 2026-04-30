import React from "react";
import {
  FiBell,
  FiBook,
  FiUser,
  FiMessageCircle,
  FiAlertTriangle,
  FiShield,
  FiStar,
} from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyNotifications,
  markNotificationsAsRead,
} from "../../features/notifications/notificationThunks";
import { useNavigate } from "react-router-dom";
import {
  approveInstructorRequest,
  rejectInstructorRequest,
} from "../../features/instructorRequest/instructorRequestThunks";
import { NOTIFICATION_UI_CONFIG } from "../../constants/notification";

const ICON_MAP = {
  book: FiBook,
  user: FiUser,
  comment: FiMessageCircle,
  alert: FiAlertTriangle,
  shield: FiShield,
  check: FiStar,
  x: FiBell,
  mail: FiBell,
  bell: FiBell,
};

const NotificationHover = ({ notifications = [] }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pagination, loading } = useSelector((s) => s.notifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ---------------- ACTIONS ---------------- */

  const loadMore = () => {
    if (!pagination?.hasNext || loading) return;

    dispatch(
      fetchMyNotifications({
        cursor: pagination.nextCursor,
        isLoadMore: true,
      })
    );
  };

  const handleMarkRead = (id) => {
    dispatch(markNotificationsAsRead([id]));
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    if (unreadIds.length) dispatch(markNotificationsAsRead(unreadIds));
  };

  const handleClickItem = (n, config) => {
    if (!n.read) handleMarkRead(n.id);

    const route = config?.route?.(n);

    if (route) {
      navigate(route);
      return;
    }

    navigate(`/notifications/${n.id}`);
  };
  /* ---------------- RENDER ITEM ---------------- */

  const renderItem = (n) => {
    const config = NOTIFICATION_UI_CONFIG[n.type] || {};
    const Icon = ICON_MAP[config.icon] || FiBell;
    const isPending = n.meta?.status === "pending";

    const handleApprove = (e) => {
      e.stopPropagation(); // ❗ tránh click li
      dispatch(approveInstructorRequest(n.entityId));
    };

    const handleReject = (e) => {
      e.stopPropagation();
      dispatch(
        rejectInstructorRequest({
          id: n.entityId,
          reason: "Not qualified",
        })
      );
    };

    return (
      <li
        key={n.id}
        onClick={() => handleClickItem(n, config)}
        className={`
          px-4 py-3 border-b border-border
          cursor-pointer transition-all
          flex gap-3 items-start
          hover:bg-muted
          animate-fade-in
          ${!n.read ? "bg-primary-soft border-l-4 border-primary" : ""}
        `}
      >
        {/* ICON */}
        <div className={`p-2 rounded-full ${config.bg}`}>
          {Icon && <Icon size={16} className={config.color} />}
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm truncate ${
              !n.read ? "font-semibold text-primary" : "opacity-70"
            }`}
          >
            {n.title}
          </p>

          <p className="text-xs opacity-70 truncate">{n.message}</p>

          {config.meta && (
            <p className="text-[11px] opacity-50 mt-1 truncate">
              {typeof config.meta === "function"
                ? config.meta(n.meta || {})
                : ""}
            </p>
          )}

          {/* 🔥 ACTION BUTTONS */}
          {config.actions && isPending && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleApprove}
                className="
                  px-3 py-1 text-xs
                  bg-green-500 text-white
                  rounded-lg
                  hover:bg-green-600
                  transition
                "
              >
                Approve
              </button>

              <button
                onClick={handleReject}
                className="
                  px-3 py-1 text-xs
                  bg-red-500 text-white
                  rounded-lg
                  hover:bg-red-600
                  transition
                "
              >
                Reject
              </button>
            </div>
          )}
        </div>

        {/* TIME */}
        <span className="text-[11px] opacity-40 whitespace-nowrap">
          {new Date(n.createdAt).toLocaleTimeString()}
        </span>
      </li>
    );
  };

  return (
    <div className="relative group">
      <button
        onClick={() => navigate("/notifications")}
        className="
        relative flex h-10 w-10 items-center justify-center
        rounded-full transition
        hover:bg-muted
      "
      >
        <FiBell size={22} />

        {unreadCount > 0 && (
          <span
            className="
            absolute -top-1 -right-1
            bg-red-500 text-white
            text-[10px]
            rounded-full w-5 h-5
            flex items-center justify-center
            animate-pulse
          "
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className="
        dropdown-menu
        animate-fade-in
        right-0
        w-[360px]
      "
      >
        {/* HEADER */}
        <div className="pb-2 mb-2 border-b border-border flex justify-between items-center">
          <span className="font-semibold text-primary">Notifications</span>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs opacity-70 hover:opacity-100"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* EMPTY */}
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm opacity-60">
            No notifications yet
          </div>
        ) : (
          <>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map(renderItem)}
            </ul>

            {/* LOAD MORE */}
            {pagination?.hasNext && (
              <button
                onClick={loadMore}
                className="
                w-full py-2 text-sm
                border-t border-border
                hover:bg-muted
                transition
              "
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationHover;
