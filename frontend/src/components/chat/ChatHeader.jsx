import React, { useState } from "react";
import {
  Pencil,
  Check,
  X,
  Ban,
  ShieldCheck,
  Users,
  Lock,
  Globe,
  Menu,
} from "lucide-react";
import { FiInfo } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { updateRoomSettings } from "../../features/chat/chatRoomsThunks";
import { selectOtherUserId } from "../../features/chat/chatRoomsSlice";
import {
  selectBlocking,
  selectBlockState,
} from "../../features/chat/userRelationsSlice";
import ChatAvatar from "./ChatAvatar";

const presenceColor = {
  online: "bg-green-500",
  busy: "bg-yellow-400",
  teaching: "bg-blue-500",
  offline: "bg-gray-400",
};

const ChatHeader = ({
  selectedRoom,
  onBlock,
  onUnblock,
  onOpenSidebar,
  onOpenRightSidebar,
}) => {
  const dispatch = useDispatch();

  const userPresence = useSelector((state) => state.chatRooms.userPresence);

  const roomId = selectedRoom?.id || selectedRoom?._id;

  // STEP 1 — luôn gọi hook nhưng chỉ lookup khi private
  const otherUserId = useSelector((state) =>
    roomId && selectedRoom?.type === "private"
      ? selectOtherUserId(state, roomId)
      : null
  );
  const { isBlocked, blockedBy } = useSelector(selectBlockState(otherUserId));

  console.log("{Đây là chặn", isBlocked, blockedBy);

  const [isEditingName, setIsEditingName] = useState(false);
  const blocking = useSelector(selectBlocking);
  const [newRoomName, setNewRoomName] = useState("");

  // STEP 2 — tính presence theo room type
  let presence = "offline";

  if (selectedRoom?.type === "private" && otherUserId) {
    presence = userPresence?.[otherUserId] || "offline";
  }

  const handleRenameRoom = async () => {
    if (!newRoomName.trim()) return;

    await dispatch(
      updateRoomSettings({
        roomId,
        settings: { name: newRoomName },
      })
    );

    setIsEditingName(false);
    setNewRoomName("");
  };

  if (!selectedRoom) {
    return (
      <header className="h-16 px-6 flex items-center border-b">
        <h2 className="text-gray-400 text-sm">
          Select a chat to start messaging
        </h2>
      </header>
    );
  }
  const onlineCount =
    selectedRoom?.type === "class"
      ? Object.keys(userPresence || {}).filter((id) =>
          selectedRoom?.user_ids?.includes(id)
        ).length
      : 0;

  return (
    <header className="h-16 flex items-center justify-between border-b px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 my-3 shrink-0 min-w-0">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-6 min-w-0 flex-1">
        <div className="relative">
          <ChatAvatar
            room={selectedRoom}
            size={36}
            className="sm:w-40 sm:h-40 md:w-48 md:h-48"
            presence={selectedRoom?.type === "private" ? presence : null}
            presenceColor={presenceColor}
          />

          {/* Presence indicator */}
          {selectedRoom?.type === "private" && (
            <span
              className={`absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-2 border-white rounded-full ${presenceColor[presence]}`}
            />
          )}
          {selectedRoom.type === "class" && (
            <span className="text-xs text-green-600">{onlineCount} online</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameRoom();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  className="w-full sm:w-auto px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRenameRoom}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check size={16} />
                  </button>

                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-primary truncate text-base sm:text-lg md:text-xl">
                  {selectedRoom.name}
                </h2>

                <button
                  onClick={() => {
                    setNewRoomName(selectedRoom.name);
                    setIsEditingName(true);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <Pencil size={14} />
                </button>
              </>
            )}
          </div>

          {/* META INFO */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {selectedRoom.user_ids.length || 0} members
            </span>

            {selectedRoom.type === "private" && (
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                <Lock size={12} />
                Private
              </span>
            )}

            {selectedRoom.type === "public" && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                <Globe size={12} />
                Public
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      {selectedRoom?.type === "private" && (
        <div
          className={`flex ${
            isEditingName
              ? "flex-col items-center gap-2"
              : "flex-row items-center gap-1 sm:gap-2"
          }`}
        >
          {/* NORMAL STATE */}
          {!isBlocked && (
            <button
              disabled={blocking}
              onClick={() => onBlock(otherUserId)}
              className="flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition"
            >
              <Ban size={14} />
              Block
            </button>
          )}

          {/* I BLOCKED */}
          {isBlocked && blockedBy === "me" && (
            <button
              disabled={blocking}
              onClick={() => onUnblock(otherUserId)}
              className="flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-medium text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition"
            >
              <ShieldCheck size={14} />
              Unblock
            </button>
          )}

          {/* THEY BLOCKED → HIDDEN (NO UI) */}
          {isBlocked && blockedBy === "other" && null}
        </div>
      )}
      {/* MOBILE TOGGLE */}
      <button onClick={onOpenSidebar} className="p-2 md:hidden">
        <Menu size={20} />
      </button>
      <button
        onClick={onOpenRightSidebar}
        className="p-2 md:p-3 ml-2 rounded hover:bg-gray-100 transition md:hidden"
        aria-label="Open room info"
      >
        <FiInfo size={20} />
      </button>
    </header>
  );
};

export default ChatHeader;
