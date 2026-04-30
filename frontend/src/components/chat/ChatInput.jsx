import React, { useRef } from "react";
import { FiSend, FiPaperclip, FiX } from "react-icons/fi";

const ChatInput = ({
  message,
  setMessage,
  isBlocked,
  blockedBy,
  replyingTo,
  setReplyingTo,
  onSend,
  onSendFile,
  currentRoomId,
  handleTyping,
}) => {
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  if (!currentRoomId) return null;

  const handleSend = () => {
    if (!message.trim()) return;

    onSend(message);

    setMessage("");
    setReplyingTo(null);
    inputRef.current?.focus();
  };

  /* ===============================
     UPLOAD QUEUE (limit 3 uploads)
  =============================== */
  const MAX_UPLOAD = 3;

  const uploadQueue = async (files) => {
    const queue = [...files];

    const workers = new Array(MAX_UPLOAD).fill(null).map(async () => {
      while (queue.length > 0) {
        const file = queue.shift();

        if (!(file instanceof File)) continue;

        await onSendFile(file);
      }
    });

    await Promise.all(workers);
  };

  return (
    <footer className=" border-t px-4 py-3 space-y-2">
      {/* ===== Reply preview ===== */}
      {replyingTo && (
        <div className="flex items-center justify-between  border-l-4 border-blue-400 px-3 py-2 rounded-md text-sm">
          <div className="truncate">
            <span className="font-semibold text-gray-700">Trả lời:</span>{" "}
            {replyingTo.content || "Tin nhắn"}
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded hover:bg-gray-200"
          >
            <FiX />
          </button>
        </div>
      )}

      {isBlocked && (
        <div className="text-xs text-red-500 text-center">
          {blockedBy === "me"
            ? "You blocked this user"
            : "You cannot send messages because you were blocked"}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* ATTACH */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isBlocked}
          className="p-2 rounded-full hover-bg-muted disabled:opacity-40"
        >
          <FiPaperclip size={20} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files);
            e.target.value = "";

            uploadQueue(files);
          }}
        />

        {/* TEXT */}
        <textarea
          ref={inputRef}
          rows={1}
          value={message}
          disabled={isBlocked}
          placeholder="Nhập tin nhắn..."
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 resize-none px-4 py-2 rounded-2xl border border-gray-200"
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() || isBlocked}
          className="p-3 rounded-full bg-green-500 text-white hover-bg-muted"
        >
          <FiSend />
        </button>
      </div>
    </footer>
  );
};

export default ChatInput;
