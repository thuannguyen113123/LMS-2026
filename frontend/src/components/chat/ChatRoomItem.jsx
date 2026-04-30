import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectOtherUserId } from "../../features/chat/chatRoomsSlice";
import { roomRead } from "../../features/chat/chatNotificationsSlice";
import ChatAvatar from "./ChatAvatar";
import { useChatSocket } from "./../../hooks/Chat/Public/useChatSocket";

const ChatRoomItem = ({
  room,
  selectedRoomId,
  onSelectRoom,
  unreadMap,
  presenceColor,
  roomTypeLabel,
}) => {
  const dispatch = useDispatch();
  const roomId = room.id || room._id;
  const unread = unreadMap?.[roomId] || 0;

  const userPresence = useSelector((state) => state.chatRooms.userPresence);
  const { markAsRead } = useChatSocket();

  // chỉ lookup otherUserId nếu private
  const otherUserId = useSelector((state) =>
    room.type === "private" ? selectOtherUserId(state, roomId) : null
  );

  let presence = "offline";
  let onlineCount = 0;

  if (room.type === "private" && otherUserId) {
    presence = userPresence?.[otherUserId] || "offline";
  }

  if (room.type === "class") {
    onlineCount = Object.keys(userPresence || {}).filter((id) =>
      room.user_ids?.includes(id)
    ).length;
  }

  const isActive = selectedRoomId === roomId;

  return (
    <li
      onClick={() => {
        if (unread > 0) {
          markAsRead(roomId);
          dispatch(roomRead({ roomId }));
        }

        onSelectRoom?.(room);
      }}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition
      ${
        isActive
          ? "bg-green-100 dark:bg-green-600 text-black"
          : "hover-bg-muted"
      }
      ${room.muted ? "opacity-60" : ""}`}
    >
      {/* avatar */}
      <ChatAvatar
        room={room}
        size={40}
        presence={room.type === "private" ? presence : null}
        presenceColor={presenceColor}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-sm font-semibold truncate" title={room.name}>
              {room.name}
            </span>
            <div
              className="text-xs truncate"
              title={room.metadata?.lastMessage?.content}
            >
              {room.metadata?.lastMessage?.content || "No messages yet"}
            </div>
          </div>
          {unread > 0 && (
            <span className="flex-none w-auto min-w-4 h-5 px-1.5 flex items-center justify-center text-[11px] font-bold text-white bg-red-500 rounded-full">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
          {/* class online count */}
          {room.type === "class" && (
            <span className="flex-none w-auto text-xs text-green-600">
              {onlineCount} online
            </span>
          )}
        </div>

        <div className="text-[10px] text-gray-400 uppercase">
          {roomTypeLabel[room.type]}
        </div>
      </div>
    </li>
  );
};

export default React.memo(ChatRoomItem);
