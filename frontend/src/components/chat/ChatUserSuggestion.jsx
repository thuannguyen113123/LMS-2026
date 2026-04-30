import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSocketContext } from "../../context/chatSocket.context";
import { selectChatRelation } from "../../features/chat/chatRequestsSlice";

const ChatUserSuggestion = ({ user }) => {
  const { socket } = useSocketContext();

  const relation = useSelector((state) => selectChatRelation(state, user.id));

  const [sending, setSending] = useState(false);

  // ✅ SEND REQUEST
  const sendRequest = () => {
    if (sending || relation !== "NONE") return;

    setSending(true);

    socket.emit("chat:request:send", { toUserId: user.id });
  };

  // ✅ QUAN TRỌNG: reset loading theo state từ server
  useEffect(() => {
    if (relation === "OUTGOING_PENDING") {
      setSending(false);
    }
  }, [relation]);

  const renderAction = () => {
    switch (relation) {
      case "OUTGOING_PENDING":
        return <span className="text-xs text-gray-400">Request Sent</span>;

      case "INCOMING_PENDING":
        return (
          <span className="text-xs text-blue-400">Respond in Requests</span>
        );

      case "ACCEPTED":
        return <span className="text-xs text-green-500">Chatting</span>;

      default:
        return (
          <button
            disabled={sending}
            onClick={sendRequest}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded disabled:opacity-50"
          >
            {sending ? "Sending..." : "Message"}
          </button>
        );
    }
  };

  return (
    <li className="flex items-center gap-3 p-2 rounded-lg hover-bg-muted transition">
      <img src={user.avatar} className="w-9 h-9 rounded-full" />

      <div className="flex-1">
        <div className="text-sm font-medium">{user.fullname}</div>
        <div className="text-xs text-gray-400">Start conversation</div>
      </div>

      {renderAction()}
    </li>
  );
};

export default React.memo(ChatUserSuggestion);
