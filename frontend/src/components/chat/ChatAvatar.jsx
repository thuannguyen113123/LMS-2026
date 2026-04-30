import React from "react";

const ChatAvatar = ({ room, size = 40, presence, presenceColor }) => {
  const avatarMeta = room?.metadata?.avatar || {};
  const letter = room?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative shrink-0">
      <div
        className="rounded-full flex items-center justify-center overflow-hidden text-white font-semibold select-none"
        style={{
          width: size,
          height: size,
          background:
            avatarMeta.type === "generated"
              ? avatarMeta.color || "#9ca3af"
              : "transparent",
          fontSize: size * 0.4,
        }}
      >
        {avatarMeta.type === "user" && avatarMeta.url ? (
          <img
            src={avatarMeta.url}
            className="w-full h-full object-cover"
            alt="avatar"
            draggable={false}
          />
        ) : (
          <span>{letter}</span>
        )}
      </div>

      {presence && presenceColor?.[presence] && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${presenceColor[presence]}`}
        />
      )}
    </div>
  );
};

export default React.memo(ChatAvatar);
