import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiUser, FiBookOpen, FiBell } from "react-icons/fi";

import {
  deleteManyNotifications,
  fetchMyNotifications,
  markNotificationsAsRead,
} from "../../features/notifications/notificationThunks";
import { selectMyNotifications } from "../../features/notifications/notificationSlice";

import SearchInput from "../../components/common/SearchInput";
import useDebounce from "../../hooks/useDebounce";
import {
  approveInstructorRequest,
  rejectInstructorRequest,
} from "../../features/instructorRequest/instructorRequestThunks";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_UI_CONFIG,
} from "../../constants/notification";
import FormField from "../../components/common/FormField";
import { openModal } from "../../features/modal/modalSlice";
import { MODAL_SETTINGS } from "../../components/modal/SettingsModal";

function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}
function formatDateLabel(date) {
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function groupByDate(list) {
  const groups = {};

  list.forEach((n) => {
    const key = new Date(n.createdAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });

  return groups;
}

const ICON_MAP = {
  user: FiUser,
  book: FiBookOpen,
  bell: FiBell,
  check: FiUser,
  x: FiBell,
  mail: FiBell,
  comment: FiBell,
};

function getIcon(type) {
  const iconKey = NOTIFICATION_UI_CONFIG[type]?.icon;

  return ICON_MAP[iconKey] || FiBell;
}
export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const notifications = useSelector(selectMyNotifications);
  const { loading } = useSelector((s) => s.notifications);
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") || "all";
  const search = params.get("search") || "";
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const debouncedSearch = useDebounce(search, 400);

  const setFilterParam = (f) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("filter", f);
      next.delete("cursor");
      return next;
    });
  };

  const setSearchParam = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);

      if (value) next.set("search", value);
      else next.delete("search");

      next.delete("cursor");
      return next;
    });
  };
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelected((prev) =>
      prev.length === notifications.length ? [] : notifications.map((n) => n.id)
    );
  };

  const handleDeleteSelected = () => {
    if (!selected.length) return;

    dispatch(deleteManyNotifications(selected));
    setSelected([]);
  };

  useEffect(() => {
    dispatch(
      fetchMyNotifications({
        filter,
        search: debouncedSearch,
      })
    );
  }, [dispatch, filter, debouncedSearch]);

  const grouped = useMemo(() => groupByDate(notifications), [notifications]);

  const handleClick = (n) => {
    dispatch(markNotificationsAsRead([n.id]));

    const config = NOTIFICATION_UI_CONFIG[n.type];

    const route = config?.route?.(n);

    if (route) {
      navigate(route);
      return;
    }

    navigate(`/notifications/${n.id}`);
  };

  const markAll = () => {
    dispatch(markNotificationsAsRead(notifications.map((n) => n.id)));
  };

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 lg:py-16 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 bg-card min-h-screen">
      {/* LEFT */}
      <div className="lg:col-span-2">
        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          {/* TITLE */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight whitespace-nowrap">
            Notifications
          </h1>

          {/* SEARCH */}
          <div className="w-full lg:flex-1 lg:max-w-md">
            <SearchInput
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearchParam(e.target.value)}
            />
          </div>

          {/* FILTER */}
          <div className="flex gap-2 p-1 rounded-xl bg-card shadow-sm overflow-x-auto">
            {["all", "unread"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterParam(f)}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg transition whitespace-nowrap ${
                  filter === f
                    ? "bg-black text-white shadow"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-6 lg:space-y-10">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider">
                {formatDateLabel(date)}
              </h2>

              <div className="space-y-3">
                {items.map((n) => {
                  const Icon = getIcon(n.type);
                  const isPending = n.meta?.status === "pending";
                  return (
                    <div
                      key={n.id}
                      className={`group flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 items-center sm:items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition ${
                        !n.read && "bg-blue-50/60"
                      }`}
                    >
                      {/* LEFT */}
                      <div className="flex gap-3 items-center sm:items-center">
                        {/* CHECKBOX */}
                        <input
                          type="checkbox"
                          checked={selected.includes(n.id)}
                          onChange={() => handleSelect(n.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 shrink-0 mt-0.5"
                        />

                        {/* CONTENT WRAP */}
                        <div
                          onClick={() => handleClick(n)}
                          className="flex gap-3 sm:gap-4 cursor-pointer items-center"
                        >
                          {/* ICON */}
                          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full border border-gray-200 flex items-center justify-center">
                            <Icon className="text-base sm:text-lg text-gray-600 block" />
                          </div>

                          {/* TEXT */}
                          <div>
                            <p
                              className={`text-sm sm:text-base ${
                                !n.read ? "font-semibold" : ""
                              }`}
                            >
                              {n.title}
                            </p>

                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                              {n.message}
                            </p>

                            <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                              {formatTime(n.createdAt)}
                            </p>
                            {n.type === NOTIFICATION_TYPE.INSTRUCTOR.REQUEST &&
                              isPending && (
                                <div
                                  className="flex gap-2 mt-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      dispatch(
                                        approveInstructorRequest(n.entityId)
                                      );
                                    }}
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
                                    onClick={() => {
                                      setRejectTarget(n.entityId);
                                    }}
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
                        </div>
                      </div>

                      {/* DELETE */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(deleteManyNotifications([n.id]));
                        }}
                        className="self-start sm:self-auto opacity-100 sm:opacity-0 group-hover:opacity-100 text-red-500 text-xs sm:text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ACTION BAR */}
        {selected.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 my-4 px-4 py-3 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.length === notifications.length}
                onChange={handleSelectAll}
              />
              <span className="text-xs sm:text-sm text-gray-600">
                {selected.length} selected
              </span>
            </div>

            <button
              onClick={handleDeleteSelected}
              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="space-y-6">
        {/* STATS */}
        <div className="p-4 sm:p-5  rounded-2xl shadow-sm">
          <h3 className="font-semibold mb-4">Overview</h3>

          <div className="flex justify-between text-xs sm:text-sm text-gray-600">
            <span>Total</span>
            <span className="font-medium text-black">
              {notifications.length}
            </span>
          </div>

          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-2">
            <span>Unread</span>
            <span className="font-medium text-black">
              {notifications.filter((n) => !n.read).length}
            </span>
          </div>
        </div>

        {/* QUICK */}
        <div className="p-4 sm:p-5  rounded-2xl shadow-sm">
          <h3 className="font-semibold mb-4">Quick Actions</h3>

          <button
            onClick={markAll}
            className="w-full py-2 text-xs sm:text-sm rounded-xl hover:bg-muted transition border border-gray-200"
          >
            Mark all as read
          </button>

          <button
            className="w-full py-2 mt-2 text-xs sm:text-sm rounded-xl hover:bg-muted transition border border-gray-200"
            onClick={() => {
              dispatch(openModal({ key: MODAL_SETTINGS }));
              close();
            }}
          >
            Notification Settings
          </button>
        </div>

        {/* INFO */}
        <div className="p-4 sm:p-5  rounded-2xl shadow-sm text-xs sm:text-sm text-gray-500">
          <h3 className="font-semibold mb-2 ">Tips</h3>
          <p>
            Notifications keep you updated with courses, users, and system
            activity.
          </p>
        </div>
      </div>
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl w-[400px]">
            <h3 className="font-semibold mb-3">Reject reason</h3>

            <FormField
              label="Reason"
              name="reason"
              type="textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason..."
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="px-3 py-1 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  dispatch(
                    rejectInstructorRequest({
                      id: rejectTarget,
                      reason: rejectReason,
                    })
                  );

                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
