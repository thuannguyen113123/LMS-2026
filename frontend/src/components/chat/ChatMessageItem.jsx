import React, { useState } from "react";
import {
  FiMoreHorizontal,
  FiCornerUpLeft,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiCheck,
  FiPaperclip,
} from "react-icons/fi";
import ReactionButton from "../common/ReactionButton";
import { useSelector } from "react-redux";
import { makeSelectMessageStatus } from "../../features/chat/messagesSlice";

const ChatMessageItem = ({
  msg,
  user,
  setReplyingTo,
  recallMessage,
  reactMessage,
  unreactMessage,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const myId = user?.id || user?._id;
  const isMine = msg.sender?.id === myId;
  const myReaction = msg.reactions?.find((r) => r.userId === myId);
  const status = useSelector(makeSelectMessageStatus(msg.roomId, msg.id, myId));

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div className="relative group max-w-xs">
        {/* ===== Reply preview ===== */}
        {msg.replyTo && (
          <button
            className="mb-1 w-full text-left text-xs bg-gray-100 border-l-4 border-blue-400 p-2 rounded-md hover:bg-gray-200 transition"
            onClick={() => {
              const el = document.getElementById(`msg-${msg.replyTo.id}`);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
              el?.classList.add("ring-2", "ring-blue-400");
              setTimeout(() => {
                el?.classList.remove("ring-2", "ring-blue-400");
              }, 1200);
            }}
          >
            <span className="font-semibold text-gray-600">
              {msg.replyTo.senderName || "Người dùng"}
            </span>
            <div className="truncate text-gray-500">
              {msg.replyTo.content || "Tin nhắn"}
            </div>
          </button>
        )}

        {/* ===== Attachments ===== */}
        {msg.attachments?.length > 0 && (
          <div className="space-y-2">
            {msg.attachments.map((att, i) => {
              const src = att.url || att.localPreview;

              if (att.type === "image") {
                return (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={att.filename}
                      onClick={() => setPreviewImage(src)}
                      className={`rounded-xl max-w-[220px] cursor-pointer hover:opacity-90 transition ${
                        att.uploading ? "opacity-70" : ""
                      }`}
                    />

                    {/* Upload overlay */}
                    {att.uploading && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex flex-col justify-end">
                        <div className="h-1 bg-gray-400/40 w-full">
                          <div
                            className="h-1 bg-green-400 transition-all"
                            style={{ width: `${att.progress || 0}%` }}
                          />
                        </div>

                        <div className="text-white text-[10px] text-center pb-1">
                          Uploading {att.progress || 0}%
                        </div>
                      </div>
                    )}

                    {/* Read receipt */}
                    {isMine && !att.uploading && (
                      <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/40 px-1 rounded flex items-center">
                        {status === "sending" && <FiClock />}
                        {status === "sent" && <FiCheck />}
                        {status === "seen" && (
                          <FiCheckCircle className="text-blue-400" />
                        )}
                      </span>
                    )}
                  </div>
                );
              }

              if (att.type === "video") {
                return (
                  <div key={i} className="relative">
                    <video
                      src={src}
                      controls={!att.uploading}
                      className="rounded-xl max-w-[260px]"
                    />

                    {isMine && !att.uploading && (
                      <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/40 px-1 rounded flex items-center">
                        {status === "sending" && <FiClock />}
                        {status === "sent" && <FiCheck />}
                        {status === "seen" && (
                          <FiCheckCircle className="text-blue-400" />
                        )}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline text-sm group"
                >
                  <FiPaperclip className="text-gray-500 group-hover:text-blue-500 transition" />
                  <span className="truncate max-w-[180px]">{att.filename}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* ===== Message bubble (chỉ render khi có content) ===== */}
        {msg.content && (
          <div
            id={`msg-${msg.id}`}
            className={`px-4 py-3 text-sm relative mt-1
            ${
              isMine
                ? "bg-green-500 text-white rounded-2xl rounded-br-sm"
                : "bg-white border rounded-2xl rounded-bl-sm"
            }`}
          >
            {msg.metadata?.deleted ? (
              <span className="italic text-white">Tin nhắn đã thu hồi</span>
            ) : (
              <>
                {msg.content}

                {isMine && (
                  <span className="ml-1 text-[10px] opacity-70 inline-flex">
                    {status === "sending" && <FiClock />}
                    {status === "sent" && <FiCheck />}
                    {status === "seen" && (
                      <FiCheckCircle className="text-blue-300" />
                    )}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== Reactions summary ===== */}
        {msg.reactions?.length > 0 &&
          (() => {
            const grouped = msg.reactions.reduce((acc, r) => {
              acc[r.reaction] = (acc[r.reaction] || 0) + 1;
              return acc;
            }, {});

            return (
              <div
                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs shadow-sm gap-1 ${
                  myReaction ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                {Object.entries(grouped).map(([emoji, count]) => (
                  <span key={emoji} className="flex items-center gap-0.5">
                    {emoji} <span className="font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            );
          })()}

        {/* ===== Reaction button ===== */}
        <div
          className={`absolute -bottom-2 ${
            isMine ? "-left-6" : "-right-6"
          } opacity-0 group-hover:opacity-100 transition-opacity z-20`}
        >
          <ReactionButton
            currentReaction={
              msg.reactions?.find((r) => r.userId === user.id)?.reaction || null
            }
            onReact={(emoji) => reactMessage(msg.id, emoji)}
            onUnreact={() => unreactMessage(msg.id)}
          />
        </div>

        {/* ===== Menu 3 dots ===== */}
        {!msg.metadata?.deleted && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${
              isMine ? "-left-7" : "-right-7"
            } opacity-0 group-hover:opacity-100 transition`}
          >
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <FiMoreHorizontal />
            </button>

            {menuOpen && (
              <div
                className={`absolute z-20 bg-white shadow-lg rounded-lg text-sm w-36 py-1 border ${
                  isMine ? "right-full mr-2" : "left-full ml-2"
                }`}
              >
                <button
                  onClick={() => {
                    setReplyingTo(msg);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100"
                >
                  <FiCornerUpLeft /> Trả lời
                </button>

                {isMine && (
                  <button
                    onClick={() => {
                      recallMessage(msg.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 text-red-500"
                  >
                    <FiTrash2 /> Thu hồi
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            className="max-h-[90%] max-w-[90%] rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ChatMessageItem;
