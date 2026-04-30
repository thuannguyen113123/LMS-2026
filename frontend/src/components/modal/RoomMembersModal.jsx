import React, { useState } from "react";
import {
  FaUserPlus,
  FaBan,
  FaVolumeMute,
  FaUserShield,
  FaCrown,
  FaUserMinus,
} from "react-icons/fa";
import CommonModal from "./CommonModal";
import UserSearchBox from "../common/UserSearchBox";

export default function RoomMembersModal({
  isOpen,
  onClose,
  roomId,
  onAddMember,
  onRemoveMember,
  onBan,
  onMute,
  onSetAdmin,
  members,
}) {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleAdd = () => {
    if (!selectedUser) return alert("Chọn người dùng trước khi thêm");
    onAddMember(roomId, selectedUser.id);
    setSelectedUser(null);
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="Thành viên phòng chat"
    >
      <div className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">Thêm thành viên:</label>
            <UserSearchBox
              excludeIds={members.map((m) => m.id)}
              onSelect={(user) => setSelectedUser(user)}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!selectedUser}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
              selectedUser
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            <FaUserPlus /> Thêm
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {!members || members.length === 0 ? (
            <p className="text-gray-500">Chưa có thành viên nào.</p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                    {m.fullname?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                      {m.fullname}
                      {m.isAdmin && (
                        <span className="text-sm text-yellow-600 font-semibold flex items-center gap-1">
                          <FaCrown /> Admin
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <button onClick={() => onBan(roomId, m.id)} title="Cấm">
                    <FaBan />
                  </button>
                  <button
                    onClick={() => onMute(roomId, m.id)}
                    title="Tắt tiếng"
                  >
                    <FaVolumeMute />
                  </button>
                  <button
                    onClick={() => onSetAdmin(roomId, m.id)}
                    title="Cấp trưởng nhóm"
                  >
                    <FaUserShield />
                  </button>
                  <button
                    onClick={() => onRemoveMember(roomId, m.id)}
                    title="Gỡ thành viên"
                  >
                    <FaUserMinus />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </CommonModal>
  );
}
