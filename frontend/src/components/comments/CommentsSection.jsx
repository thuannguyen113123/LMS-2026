import React from "react";
import { Send, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { useSelector } from "react-redux";

import { CommentItem } from "./CommentItem";
import ReportCommentModal from "../modal/ReportCommentModal";
import SortToggle from "../common/SortToggle";
import useCourseComments from "./../../hooks/Course/Public/useCourseComments";

const CommentsSection = ({ targetType, targetId }) => {
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);

  const {
    comments,
    loading,
    newComment,
    setNewComment,
    handleAddComment,
    handleReply,
    handleLike,
    handleDelete,
    replyingTo,
    setReplyingTo,
    replyContentMap,
    setReplyContentMap,
    fetchReplies,
    loadingReplies,
    reportModal,
    handleOpenReport,
    handleConfirmReport,
    toggleReplies,
    openReplies,
    showEmoji,
    setShowEmoji,
    hasMoreComments,
    loadMoreComments,
    sortType,
    changeSort,
    getReplies,
  } = useCourseComments({
    targetType,
    targetId,
    currentUser,
  });

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleSubmitComment = () => {
    if (!currentUser) {
      handleLoginRedirect();
      return;
    }

    handleAddComment();
  };

  if (loading) {
    return <p className="text-gray-500 italic">Đang tải bình luận...</p>;
  }

  return (
    <div className="relative z-10">
      {/* ================= HEADER ================= */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary">
            Bình luận ({comments.length})
          </h3>

          <SortToggle value={sortType} onChange={changeSort} />
        </div>

        {/* ================= COMMENT LIST ================= */}
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            currentUser={currentUser}
            replies={getReplies(c.id)} // ✅ correct
            toggleReplies={toggleReplies}
            handleLike={handleLike}
            handleDelete={handleDelete}
            handleReply={handleReply}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyContent={replyContentMap[c.id]}
            setReplyContent={(val) =>
              setReplyContentMap((prev) => ({
                ...prev,
                [c.id]: val,
              }))
            }
            loadingReplies={loadingReplies}
            fetchReplies={fetchReplies}
            isOpen={openReplies[c.id]}
            openReplies={openReplies}
            getReplies={getReplies}
            handleOpenReport={handleOpenReport}
          />
        ))}
      </div>

      {/* ================= LOAD MORE ================= */}
      {hasMoreComments && (
        <button
          disabled={loading}
          onClick={loadMoreComments}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          {loading ? "Đang tải..." : "Xem thêm bình luận"}
        </button>
      )}

      {/* ================= COMMENT INPUT ================= */}
      <div className="flex gap-3 mb-6 mt-6">
        {/* AVATAR */}
        <img
          src={
            currentUser?.fullname
              ? `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser.fullname}`
              : "https://i.pravatar.cc/150?u=guest"
          }
          alt="avatar"
          className="w-10 h-10 rounded-full"
        />

        <div className="flex-1 relative">
          {/* ================= NOT LOGIN ================= */}
          {!currentUser && (
            <div className=" border border-gray-200 rounded-2xl px-4 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Bạn cần đăng nhập để bình luận
              </span>

              <button
                disabled={!currentUser}
                className={`w-8 h-8 rounded-full flex items-center justify-center  ${
                  currentUser
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
              >
                <Send size={48} />
              </button>
            </div>
          )}

          {/* ================= LOGGED IN ================= */}
          {currentUser && (
            <>
              <textarea
                rows={4}
                value={newComment}
                placeholder="Viết bình luận..."
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full  border border-gray-200 rounded-2xl px-4 py-3 pr-20 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />

              {/* EMOJI BUTTON */}
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className="absolute right-12 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover-bg-muted"
              >
                <Smile size={48} />
              </button>

              {/* SEND BUTTON */}
              <button
                onClick={handleSubmitComment}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <Send size={14} />
              </button>

              {/* EMOJI PICKER */}
              {showEmoji && (
                <div className="absolute bottom-14 right-0 z-50">
                  <EmojiPicker
                    height={350}
                    onEmojiClick={(emoji) => {
                      setNewComment((prev) => prev + emoji.emoji);
                      setShowEmoji(false);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= REPORT MODAL ================= */}
      <ReportCommentModal
        isOpen={reportModal.isOpen}
        onClose={reportModal.close}
        onConfirm={handleConfirmReport}
      />
    </div>
  );
};

export default CommentsSection;
