import React, { memo } from "react";
import {
  FaThumbsUp,
  FaTrash,
  FaPaperPlane,
  FaReply,
  FaFlag,
} from "react-icons/fa";

export const ReplyItem = memo(
  ({
    reply,
    replies,
    isOpen,
    toggleReplies,
    currentUser,
    handleLike,
    handleDelete,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    handleReply,
    loadingReplies,
    getReplies,
    openReplies,
  }) => {
    const isReplying = replyingTo === reply.id;

    return (
      <div className="flex gap-2">
        <img
          src={`https://api.dicebear.com/9.x/initials/svg?seed=${reply.author?.fullname}`}
          className="w-8 h-8 rounded-full"
          alt=""
        />

        <div className="flex-1">
          {/* Bubble */}
          <div className="rounded-xl px-3 py-2">
            <p className="text-xs font-semibold text-gray-800">
              {reply.author?.fullname}
              <span className="ml-2 text-[11px] text-gray-400">
                {new Date(reply.createdAt).toLocaleString("vi-VN")}
              </span>
            </p>
            <p className="text-sm text-gray-700 mt-0.5">{reply.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 ml-2 text-xs text-gray-500">
            <button
              onClick={() => handleLike(reply.id, reply.isLiked)}
              className={`
                flex items-center gap-1 transition-all duration-150
                ${
                  reply.isLiked
                    ? "text-indigo-600 scale-105"
                    : "hover:text-indigo-600"
                }
              `}
            >
              <FaThumbsUp size={11} /> {reply.likeCount || 0}
            </button>

            <button
              onClick={() => setReplyingTo(isReplying ? null : reply.id)}
              className="hover:text-indigo-600 flex items-center gap-1"
            >
              <FaReply size={11} /> Trả lời
            </button>

            {reply.author?.id === currentUser?.id && (
              <button
                onClick={() => handleDelete(reply.id)}
                className="hover:text-red-600 flex items-center gap-1"
              >
                <FaTrash size={11} /> Xóa
              </button>
            )}

            {/* 🔥 FETCH REPLY CON – CHUẨN */}
            {reply.replyCount > 0 && (
              <button
                onClick={() => toggleReplies(reply.id)}
                className="text-indigo-600 text-xs font-medium"
              >
                {isOpen ? "Ẩn trả lời" : `Xem ${reply.replyCount} trả lời`}
              </button>
            )}
          </div>

          {/* 🔥 REPLIES CỦA REPLY */}
          {isOpen && (
            <div className="mt-2 ml-4 border-l border-gray-200 pl-3 space-y-2">
              {loadingReplies?.[reply.id] && (
                <p className="text-xs text-gray-400 italic">
                  Đang tải phản hồi...
                </p>
              )}

              {replies?.map((child) => (
                <ReplyItem
                  key={child.id}
                  reply={child}
                  replies={getReplies(child.id)} // ✅ đúng flow redux
                  isOpen={openReplies?.[child.id]}
                  toggleReplies={toggleReplies}
                  currentUser={currentUser}
                  handleLike={handleLike}
                  handleDelete={handleDelete}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  handleReply={handleReply}
                  loadingReplies={loadingReplies}
                  getReplies={getReplies}
                  openReplies={openReplies}
                />
              ))}
            </div>
          )}

          {/* Reply input */}
          {isReplying && (
            <div className="flex gap-2 mt-2 ml-2">
              <input
                value={replyContent || ""}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!replyContent?.trim()) return;
                    handleReply(reply.id, replyContent);
                  }
                }}
                placeholder="Trả lời phản hồi..."
                className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm focus:outline-none"
              />
              <button
                onClick={() => {
                  if (!replyContent?.trim()) return;
                  handleReply(reply.id, replyContent);
                }}
                className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500"
              >
                <FaPaperPlane size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export const CommentItem = memo(
  ({
    comment,
    currentUser,
    toggleReplies,
    handleLike,
    handleDelete,
    handleReply,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    loadingReplies,
    handleOpenReport,
    replies,
    isOpen,
    getReplies,

    openReplies,
    replyContentMap,
    setReplyContentMap,
  }) => {
    const isReplying = replyingTo === comment.id;

    console.log("testLike", comment);

    return (
      <div className="flex gap-3">
        <img
          src={`https://api.dicebear.com/9.x/initials/svg?seed=${comment.author?.fullname}`}
          className="w-10 h-10 rounded-full"
          alt=""
        />

        <div className="flex-1">
          {/* Comment bubble */}
          <div className="border border-gray-200 rounded-2xl px-4 py-3">
            <p className="text-sm font-bold">
              {comment.author?.fullname}
              <span className="ml-2 text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleString("vi-VN")}
              </span>
            </p>
            <p className="text-sm mt-1">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 ml-3 text-xs text-gray-500">
            <button
              onClick={() => handleLike(comment.id, comment.isLiked)}
              className={`
                flex items-center gap-1 transition-all duration-150
                ${
                  comment.isLiked
                    ? "text-indigo-600 scale-105"
                    : "hover:text-indigo-600"
                }
              `}
            >
              <FaThumbsUp size={12} /> {comment.likeCount || 0}
            </button>

            <button
              onClick={() => setReplyingTo(isReplying ? null : comment.id)}
              className="hover:text-indigo-600 flex items-center gap-1"
            >
              <FaReply size={12} /> Trả lời
            </button>

            <button
              onClick={() => handleOpenReport(comment.id)}
              className="hover:text-orange-500 flex items-center gap-1"
            >
              <FaFlag size={11} /> Báo cáo
            </button>

            {comment.replyCount > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-indigo-600 font-medium"
              >
                {isOpen ? "Ẩn trả lời" : `Xem ${comment.replyCount} trả lời`}
              </button>
            )}

            {comment.author?.id === currentUser?.id && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="hover:text-red-600 flex items-center gap-1"
              >
                <FaTrash size={12} /> Xóa
              </button>
            )}
          </div>

          {/* Replies */}
          {isOpen && (
            <div className="mt-2 ml-4 border-l border-gray-200 pl-3 space-y-2">
              {loadingReplies?.[comment.id] && (
                <p className="text-xs text-gray-400 italic">
                  Đang tải phản hồi...
                </p>
              )}

              {replies?.map((child) => (
                <ReplyItem
                  key={child.id}
                  reply={child}
                  replies={getReplies(child.id)}
                  isOpen={openReplies?.[child.id]}
                  toggleReplies={toggleReplies}
                  currentUser={currentUser}
                  handleLike={handleLike}
                  handleDelete={handleDelete}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  handleReply={handleReply}
                  loadingReplies={loadingReplies}
                  getReplies={getReplies}
                  replyContentMap={replyContentMap}
                  setReplyContentMap={setReplyContentMap}
                />
              ))}
            </div>
          )}

          {/* Reply input */}
          {isReplying && (
            <div className="flex gap-2 mt-3 ml-6">
              <input
                value={replyContent || ""}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!replyContent?.trim()) return;
                    handleReply(comment.id, replyContent);
                  }
                }}
                placeholder="Viết phản hồi..."
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none"
              />
              <button
                onClick={() => {
                  if (!replyContent?.trim()) return;
                  handleReply(comment.id, replyContent);
                }}
                className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500"
              >
                <FaPaperPlane size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
