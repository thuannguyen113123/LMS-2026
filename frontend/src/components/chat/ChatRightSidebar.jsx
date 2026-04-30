import React from "react";
import RoomMembersModal from "./../modal/RoomMembersModal";
import {
  FiUsers,
  FiMoreVertical,
  FiFileText,
  FiImage,
  FiVideo,
  FiLink,
} from "react-icons/fi";
import ChatAvatar from "./ChatAvatar";

const ChatRightSidebar = ({
  selectedRoom,
  membersModal,
  members,
  openMembersModal,
  addMember,
  removeMember,
  banUser,
  muteUser,
  setAdmin,
  stats,
}) => {
  const StatCard = ({ label, value }) => (
    <div className="rounded-xl p-4 shadow-sm text-center hover:shadow-md transition border broder-gray-200">
      <p className="font-bold text-xl ">{value}</p>
      <p className="text-xs ">{label}</p>
    </div>
  );

  const StatItem = ({ icon, label, value }) => (
    <li className="flex items-center justify-between hover-bg-muted mt-2">
      <div className="flex items-center gap-3 text-lg fo">
        {icon}
        {label}
      </div>
      <span className="text-lg">{value ?? 0}</span>
    </li>
  );

  return (
    <aside className="xl:flex flex-col w-[280px] 2xl:w-[320px] my-3 shrink-0 border-l overflow-y-auto">
      {selectedRoom ? (
        <>
          {/* ===== Header ===== */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold  flex items-center gap-2">
              <FiUsers />
              Group Info
            </h3>
          </div>

          {/* ===== Group Info ===== */}
          <div className="p-5 flex flex-col items-center border-b text-center">
            <ChatAvatar room={selectedRoom} size={96} />

            <h4 className="font-bold  text-lg truncate max-w-full">
              {selectedRoom.name}
            </h4>

            <p className="text-sm  mb-4">
              {selectedRoom.user_ids?.length || 0} members
            </p>

            <button
              onClick={() =>
                openMembersModal(selectedRoom._id || selectedRoom.id)
              }
              className="px-4 py-2 text-sm rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition font-medium"
            >
              View Members
            </button>
          </div>

          {/* ===== Stats ===== */}
          <div className="p-5 grid grid-cols-2 gap-3 border-b">
            <StatCard label="Files" value={stats?.files ?? 0} />
            <StatCard label="Links" value={stats?.links ?? 0} />
          </div>

          {/* ===== File Types ===== */}
          <ul className="space-y-3 text-sm text-gray-600">
            <StatItem
              icon={<FiFileText />}
              label="Documents"
              value={stats?.documents}
            />
            <StatItem icon={<FiImage />} label="Images" value={stats?.images} />
            <StatItem icon={<FiVideo />} label="Videos" value={stats?.videos} />
            <StatItem
              icon={<FiLink />}
              label="Shared Links"
              value={stats?.links}
            />
          </ul>
        </>
      ) : (
        <div className="flex flex-col justify-center items-center h-full text-gray-400 text-sm">
          <FiUsers className="w-8 h-8 mb-2 opacity-50" />
          <p>Select a room to view details</p>
        </div>
      )}

      {/* ===== Members Modal ===== */}
      <RoomMembersModal
        isOpen={membersModal.isOpen}
        onClose={membersModal.close}
        members={members}
        roomId={selectedRoom?._id || selectedRoom?.id}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onBan={banUser}
        onMute={muteUser}
        onSetAdmin={setAdmin}
      />
    </aside>
  );
};

export default ChatRightSidebar;
