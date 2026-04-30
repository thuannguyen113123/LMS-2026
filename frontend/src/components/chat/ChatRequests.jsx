import React from "react";
import { useSelector } from "react-redux";
import { useSocketContext } from "../../context/chatSocket.context";

const ChatRequests = () => {
  const { socket } = useSocketContext();

  const requests = useSelector((state) => state.chatRequests.lists.incoming);

  console.log(requests);

  if (!requests.length) {
    return (
      <div className="text-center text-sm text-gray-400 py-6">No requests</div>
    );
  }

  const handleAccept = (requestId) => {
    socket.emit("chat:request:accept", { requestId }, () => {});
  };

  const handleReject = (requestId) => {
    socket.emit("chat:request:reject", { requestId });
  };

  return (
    <ul className="space-y-2">
      {requests.map((req) => (
        <li
          key={req.id}
          className="flex items-center gap-3 p-2 rounded-lg hover-bg-muted"
        >
          <img src={req.fromUser?.avatar} className="w-9 h-9 rounded-full" />

          <div className="flex-1">
            <div className="text-sm text-red-500 font-medium">
              {req.fromUser?.fullname}
            </div>

            <div className="text-xs text-gray-400">wants to chat</div>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handleAccept(req.id)}
              className="text-xs px-2 py-1 bg-green-500 text-white rounded"
            >
              Accept
            </button>

            <button
              onClick={() => handleReject(req.id)}
              className="text-xs px-2 py-1 border border-gray-200 rounded"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default React.memo(ChatRequests);
