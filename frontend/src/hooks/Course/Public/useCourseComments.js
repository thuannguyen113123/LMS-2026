import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCommentsByTarget,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  reportComment,
  uploadCommentAttachment,
  restoreComment,
  fetchRepliesByParent,
} from "../../../features/comment/commentsThunks";
import { addToast } from "../../../features/ui/uiSlice";
import { optimisticLike } from "../../../features/comment/commentsSlice";
import useModal from "../../useModal";

const useCourseComments = ({ targetType, targetId }) => {
  const dispatch = useDispatch();

  const entities = useSelector((state) => state.comments.entities);
  const byTarget = useSelector((state) => state.comments.byTarget);

  const error = useSelector((state) => state.comments.error);

  const repliesByParentState = useSelector(
    (state) => state.comments.repliesByParent
  );

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [replyContentMap, setReplyContentMap] = useState({});

  const [openReplies, setOpenReplies] = useState({});

  const reportModal = useModal("reportComment");
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const [sortType, setSortType] = useState("new");
  const loadingReplies = useSelector((state) => state.comments.repliesLoading);

  const targetKey = useMemo(
    () => `${targetType}_${targetId}_${sortType}`,
    [targetType, targetId, sortType]
  );
  const targetState = byTarget[targetKey] || {
    ids: [],
    nextPageToken: null,
    hasNext: true,
  };

  const loading = useSelector(
    (state) => state.comments.loading.byTarget[targetKey]
  );
  const commentsList = useMemo(() => {
    return targetState.ids.map((id) => entities[id]).filter(Boolean);
  }, [targetState.ids, entities]);

  useEffect(() => {
    if (!targetId) return;

    dispatch(
      fetchCommentsByTarget({
        targetType,
        targetId,
        startAfterId: null,
        isNextPage: false,
        sort: sortType,
      })
    );
  }, [dispatch, targetType, targetId, sortType]);

  const getReplies = useCallback(
    (parentId) => {
      const parent = repliesByParentState[parentId];

      if (!parent) return [];

      return parent.ids.map((id) => entities[id]).filter(Boolean);
    },
    [repliesByParentState, entities]
  );

  const handleOpenReport = useCallback(
    (commentId) => {
      setSelectedReportId(commentId);
      reportModal.open();
    },
    [reportModal]
  );

  const handleConfirmReport = useCallback(
    (reason) => {
      if (!selectedReportId) return;
      dispatch(reportComment({ commentId: selectedReportId, reason }));
      reportModal.close();
      setSelectedReportId(null);
    },
    [dispatch, reportModal, selectedReportId]
  );

  const handleAddComment = useCallback(async () => {
    try {
      if (!newComment.trim()) return;

      await dispatch(
        createComment({
          content: newComment,
          targetType,
          targetId: targetId,
        })
      ).unwrap();

      setNewComment("");
    } catch (err) {
      console.log(err);
    }
  }, [dispatch, targetId, newComment, targetType]);

  // Reply to comment
  const handleReply = useCallback(
    async (parentId, content) => {
      if (!content.trim()) return;

      await dispatch(
        createComment({
          content,
          targetType,
          targetId,
          parentId,
        })
      ).unwrap();

      setReplyContentMap((prev) => ({
        ...prev,
        [parentId]: "",
      }));

      setReplyingTo(null);
    },
    [dispatch, targetId, targetType]
  );

  const handleLike = useCallback(
    (commentId, currentLiked) => {
      if (!commentId) return;
      const nextIsLiked = !currentLiked;

      dispatch(
        optimisticLike({
          commentId,
          isLiked: nextIsLiked,
        })
      );

      dispatch(
        likeComment({
          commentId,
          isLiked: nextIsLiked,
          prevIsLiked: currentLiked,
        })
      );
    },
    [dispatch]
  );

  const handleReport = useCallback(
    async (commentId, reason) => {
      await dispatch(reportComment({ commentId, reason }));
    },
    [dispatch]
  );

  const handleDelete = useCallback(
    async (commentId) => {
      if (!window.confirm("Bạn có chắc muốn xóa bình luận này không?")) return;

      setOpenReplies((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });

      setReplyingTo((prev) => (prev === commentId ? null : prev));

      try {
        await dispatch(deleteComment(commentId)).unwrap();

        dispatch(
          addToast({
            type: "success",
            title: "Đã xóa",
            message: "Bình luận đã được xóa thành công.",
          })
        );
      } catch (err) {
        console.log(err);

        dispatch(
          addToast({
            type: "error",
            title: "Lỗi xóa",
            message: "Không thể xóa bình luận này.",
          })
        );
      }
    },
    [dispatch]
  );

  const handleEdit = useCallback(
    async (commentId, content) => {
      try {
        await dispatch(updateComment({ id: commentId, content })).unwrap();
        dispatch(
          addToast({
            type: "success",
            title: "Đã cập nhật",
            message: "Bình luận đã được chỉnh sửa.",
          })
        );
      } catch (err) {
        dispatch(
          addToast({
            type: "error",
            title: "Lỗi cập nhật",
            message: "Không thể cập nhật bình luận.",
          })
        );
        console.log(err);
      }
    },
    [dispatch]
  );

  const handleUpload = useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      setUploading(true);
      try {
        const uploaded = await dispatch(
          uploadCommentAttachment(formData)
        ).unwrap();
        setUploading(false);
        dispatch(
          addToast({
            type: "success",
            title: "Đã tải lên",
            message: "Tệp đã được tải lên thành công.",
          })
        );
        return uploaded;
      } catch (err) {
        setUploading(false);
        console.log(err);

        return null;
      }
    },
    [dispatch]
  );

  const handleRestore = useCallback(
    async (id) => {
      await dispatch(restoreComment(id));
    },
    [dispatch]
  );

  const topLevelComments = useMemo(
    () => commentsList.filter((c) => !c?.parentId),
    [commentsList]
  );

  // Fetch replies on demand (lazy load)
  const fetchReplies = useCallback(
    async (parentId) => {
      await dispatch(
        fetchRepliesByParent({
          parentId,
          startAfterId: null,
          limit: 10,
        })
      );
    },
    [dispatch]
  );
  const toggleReplies = useCallback(
    (parentId) => {
      if (loadingReplies[parentId]) return;

      setOpenReplies((prev) => {
        const isOpen = !!prev[parentId];

        const parent = repliesByParentState[parentId];

        if (!isOpen && (!parent || parent.ids.length === 0)) {
          fetchReplies(parentId);
        }

        return {
          ...prev,
          [parentId]: !isOpen,
        };
      });
    },
    [fetchReplies, repliesByParentState, loadingReplies]
  );

  const loadMoreComments = useCallback(() => {
    if (!targetId) return;
    if (!targetState.hasNext) return;
    if (loading) return;

    dispatch(
      fetchCommentsByTarget({
        targetType,
        targetId,
        startAfterId: targetState.nextPageToken,
        isNextPage: true,
        sort: sortType,
      })
    );
  }, [
    dispatch,
    targetType,
    targetId,
    targetState.nextPageToken,
    targetState.hasNext,
    loading,
    sortType,
  ]);
  const changeSort = useCallback((type) => {
    setSortType(type);
  }, []);
  const hasMoreComments = targetState.hasNext;
  /* -------------------------------------------------------------------------- */
  /* 🔹 TRẢ VỀ DỮ LIỆU VÀ ACTIONS                                             */
  /* -------------------------------------------------------------------------- */
  return {
    loading,
    uploading,
    error,
    // stats,
    // myComments,
    loadMoreComments,
    hasMoreComments,

    comments: topLevelComments,

    getReplies,

    toggleReplies,

    openReplies,

    loadingReplies,

    handleReply,

    handleLike,

    handleDelete,

    handleEdit,

    handleAddComment,

    newComment,
    setNewComment,

    replyingTo,
    setReplyingTo,

    handleUpload,
    handleRestore,

    replyContentMap,
    setReplyContentMap,

    fetchReplies,
    reportModal,
    handleOpenReport,
    handleConfirmReport,

    showEmoji,
    setShowEmoji,

    sortType,
    changeSort,

    handleReport,
  };
};

export default useCourseComments;
