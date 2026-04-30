import React, { useState } from "react";
import { useSelector } from "react-redux";

import ChatRoomItem from "./ChatRoomItem";
import ChatRequests from "./ChatRequests";
import ChatSuggestions from "./ChatSuggestions";
import ChatUserSuggestion from "./ChatUserSuggestion";
import { selectPendingIncoming } from "../../features/chat/chatRequestsSlice";
import useChatRoomsPublic from "./../../hooks/Chat/Public/useChatRoomsPublic";

const presenceColor = {
  online: "bg-green-500",
  busy: "bg-yellow-400",
  teaching: "bg-blue-500",
  offline: "bg-gray-400",
};

const roomTypeLabel = {
  class: "Class",
  teacher_student: "Teacher",
  private: "Chat",
  system: "System",
};

const ChatSidebar = ({ onSelectRoom, selectedRoomId }) => {
  const authUser = useSelector((state) => state.auth.user);
  const incomingCount = useSelector(selectPendingIncoming).length;

  const { rooms, search, setSearch, loading, unreadMap, list } =
    useChatRoomsPublic();

  const [tab, setTab] = useState("rooms");

  return (
    <aside className="flex flex-col h-full w-full border-r border-gray-200 ">
      <div className="p-3 md:p-4 flex items-center gap-3 border-b">
        <img
          src={authUser?.avatar || "https://via.placeholder.com/48"}
          className="w-9 h-9 md:w-11 md:h-11 rounded-full object-cover"
        />

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm md:text-base truncate">
            {authUser?.fullname || "User"}
          </div>

          <div className="text-[11px] md:text-xs text-gray-500">Chat LMS</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="p-2 md:p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search class / teacher..."
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-200"
        />
      </div>

      {/* TABS */}
      <div className="flex border-b text-xs md:text-sm font-medium">
        <button
          onClick={() => setTab("rooms")}
          className={`flex-1 py-2 ${
            tab === "rooms"
              ? "text-green-600 border-b-2 border-green-500"
              : "text-gray-500"
          }`}
        >
          Chats
        </button>

        <button
          onClick={() => setTab("requests")}
          className={`relative flex-1 py-2 ${
            tab === "requests"
              ? "text-green-600 border-b-2 border-green-500"
              : "text-gray-500"
          }`}
        >
          Requests
          {incomingCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
              {incomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("suggested")}
          className={`flex-1 py-2 ${
            tab === "suggested"
              ? "text-green-600 border-b-2 border-green-500"
              : "text-gray-500"
          }`}
        >
          Suggested
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-1 md:px-2 pb-3">
        {tab === "rooms" && (
          <>
            {loading && (
              <div className="text-center text-sm text-gray-400 py-6">
                Loading chats...
              </div>
            )}

            {!loading && rooms.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-6">
                No conversations
              </div>
            )}

            <ul className="space-y-1">
              {list.map((item) => {
                if (item.type === "room") {
                  return (
                    <ChatRoomItem
                      key={item.data.id || item.data._id}
                      room={item.data}
                      unreadMap={unreadMap}
                      selectedRoomId={selectedRoomId}
                      onSelectRoom={onSelectRoom}
                      presenceColor={presenceColor}
                      roomTypeLabel={roomTypeLabel}
                    />
                  );
                }

                return (
                  <ChatUserSuggestion key={item.data.id} user={item.data} />
                );
              })}
            </ul>
          </>
        )}

        {tab === "requests" && <ChatRequests />}

        {tab === "suggested" && <ChatSuggestions />}
      </div>
    </aside>
  );
};

export default React.memo(ChatSidebar);
