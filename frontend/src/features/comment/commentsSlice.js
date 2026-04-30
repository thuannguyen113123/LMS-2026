import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchCommentsByTarget,
  fetchRepliesByParent,
  fetchCommentById,
  createComment,
  updateComment,
  deleteComment,
  deleteManyComments,
  fetchComments,
  likeComment,
  reportComment,
  restoreComment,
  uploadCommentAttachment,
  fetchMyComments,
  fetchCommentStats,
  fetchHomeComments,
  exportComments,
  previewExportComments,
} from "./commentsThunks";

const commentsAdapter = createEntityAdapter({
  selectId: (comment) => comment.id,
});

const initialState = commentsAdapter.getInitialState({
  loading: {
    admin: false,
    byTarget: {},
    replies: false,
    detail: false,
    list: false,
    pagination: false,
    create: false,
    update: false,
    delete: false,
    deleteMany: false,
    myComments: false,
    uploadAttachment: false,
    export: false,
  },
  error: null,
  selectedComment: null,
  page: 1,
  limit: 10,
  nextPageToken: null,
  prevPageTokens: [],
  myComments: [],
  stats: null,
  lastUploaded: null,
  homeFeed: {
    ids: [],
    loading: false,
    initialized: false, // ⭐ quan trọng
    nextPageToken: null,
    page: 1,
  },
  byTarget: {},
  errorCode: null,
  lastActionCode: null,
  repliesByParent: {},
  exportPreview: null,
  previewLoading: false,
  lists: {
    admin: [],
  },

  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  repliesLoading: {},
});

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearSelectedComment(state) {
      state.selectedComment = null;
    },
    goToPrevPage(state) {
      if (state.prevPageTokens.length > 0) {
        const lastToken = state.prevPageTokens.pop();
        state.nextPageToken = lastToken;
        state.page = Math.max(1, state.page - 1);
      }
    },

    clearError(state) {
      state.error = null;
    },
    clearStats(state) {
      state.stats = null;
    },
    clearMyComments(state) {
      state.myComments = [];
    },
    clearLastUploaded(state) {
      state.lastUploaded = null;
    },
    optimisticLike: (state, action) => {
      const { commentId, isLiked } = action.payload;

      const comment = state.entities[commentId];
      if (!comment) return;

      const currentCount = comment.likeCount || 0;

      comment.isLiked = isLiked;
      comment.likeCount = currentCount + (isLiked ? 1 : -1);
    },
  },
  extraReducers: (builder) => {
    builder

      // FETCH ALL
      .addCase(fetchComments.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { comments, pagination } = action.payload;

        commentsAdapter.upsertMany(state, comments);

        state.lists.admin = comments.map((c) => c.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchComments.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      // FETCH BY COURSE
      .addCase(fetchCommentsByTarget.pending, (state, action) => {
        const { targetType, targetId, isNextPage, sort } = action.meta.arg;

        const key = `${targetType}_${targetId}_${sort || "new"}`;

        if (!isNextPage) {
          state.loading.byTarget[key] = true;
        }

        state.error = null;

        if (!state.byTarget[key]) {
          state.byTarget[key] = {
            ids: [],
            nextPageToken: null,
            hasNext: true,
          };
        }
      })

      .addCase(fetchCommentsByTarget.fulfilled, (state, action) => {
        const {
          targetType,
          targetId,
          data,
          nextPageToken,
          hasNext,
          isNextPage,
        } = action.payload;

        // ✅ FIX: lấy type từ meta.arg
        const sort = action.meta.arg.sort || "new";

        const key = `${targetType}_${targetId}_${sort}`;
        state.loading.byTarget[key] = false;

        if (!state.byTarget[key]) {
          state.byTarget[key] = {
            ids: [],
            nextPageToken: null,
            hasNext: true,
          };
        }

        const targetState = state.byTarget[key];

        commentsAdapter.upsertMany(state, data);

        if (isNextPage) {
          const newIds = data.map((c) => c.id);

          const uniqueIds = newIds.filter(
            (id) => !targetState.ids.includes(id)
          );

          targetState.ids.push(...uniqueIds);
        } else {
          targetState.ids = data.map((c) => c.id);
        }

        targetState.nextPageToken = nextPageToken;
        targetState.hasNext = hasNext;
      })

      .addCase(fetchCommentsByTarget.rejected, (state, action) => {
        state.error = action.payload;
      });

    builder.addCase(fetchHomeComments.pending, (state) => {
      state.homeFeed.loading = true;
      state.error = null;
    });

    builder
      .addCase(fetchHomeComments.fulfilled, (state, action) => {
        state.homeFeed.loading = false;
        state.homeFeed.initialized = true;

        const { data, nextPageToken, isNextPage } = action.payload;

        // cache global
        commentsAdapter.upsertMany(state, data);

        if (isNextPage) {
          state.homeFeed.ids.push(...data.map((c) => c.id));
          state.homeFeed.page += 1;
        } else {
          state.homeFeed.ids = data.map((c) => c.id);
          state.homeFeed.page = 1;
        }

        state.homeFeed.nextPageToken = nextPageToken;
      })

      .addCase(fetchHomeComments.rejected, (state, action) => {
        state.homeFeed.loading = false;
        state.homeFeed.initialized = true;
        state.error = action.payload || action.error.message;
      })

      // FETCH REPLIES
      .addCase(fetchRepliesByParent.pending, (state, action) => {
        const { parentId } = action.meta.arg;

        state.repliesLoading[parentId] = true;
        state.error = null;
      })

      .addCase(fetchRepliesByParent.fulfilled, (state, action) => {
        state.repliesLoading[parentId] = false;

        const { parentId, replies, nextPageToken } = action.payload;

        // cache entities global
        commentsAdapter.upsertMany(state, replies);

        // init nếu chưa có
        if (!state.repliesByParent[parentId]) {
          state.repliesByParent[parentId] = {
            ids: [],
            nextPageToken: null,
          };
        }

        const parentState = state.repliesByParent[parentId];

        const newIds = replies.map((r) => r.id);

        // tránh duplicate
        const uniqueIds = newIds.filter((id) => !parentState.ids.includes(id));

        parentState.ids.push(...uniqueIds);

        parentState.nextPageToken = nextPageToken;
      })

      .addCase(fetchRepliesByParent.rejected, (state, action) => {
        const parentId = action.meta.arg.parentId;
        state.repliesLoading[parentId] = false;
        state.error = action.payload?.message || action.error.message;
      })

      // FETCH BY ID
      .addCase(fetchCommentById.pending, (state) => {
        state.loading.detail = true;
        state.error = null;
      })
      .addCase(fetchCommentById.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.selectedComment = action.payload;
        commentsAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchCommentById.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload || action.error.message;
      })

      // CREATE
      .addCase(createComment.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createComment.fulfilled, (state, action) => {
        state.loading.create = false;
        state.lastActionCode = action.payload.code;

        const comment = action.payload.comment;
        if (!comment) return;

        // 1. add entity
        commentsAdapter.addOne(state, comment);

        const sortType = "new"; // hoặc lấy từ meta nếu có
        const key = `${comment.targetType}_${comment.targetId}_${sortType}`;

        // 2. ensure target exists
        if (!state.byTarget[key]) {
          state.byTarget[key] = {
            ids: [],
            nextPageToken: null,
            hasNext: true,
          };
        }

        // 3. nếu là comment cha
        if (!comment.parentId) {
          // add vào đầu list (newest first)
          state.byTarget[key].ids.unshift(comment.id);
        }

        // 4. nếu là reply
        if (comment.parentId) {
          if (!state.repliesByParent[comment.parentId]) {
            state.repliesByParent[comment.parentId] = {
              ids: [],
              nextPageToken: null,
            };
          }

          state.repliesByParent[comment.parentId].ids.unshift(comment.id);

          // optional: tăng replyCount của parent
          const parent = state.entities[comment.parentId];
          if (parent) {
            parent.replyCount = (parent.replyCount || 0) + 1;
          }
        }
      })

      .addCase(createComment.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code || "COMMENT_CREATE_FAILED";
      })

      // UPDATE
      .addCase(updateComment.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.loading.update = false;
        commentsAdapter.upsertOne(state, action.payload);
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload || action.error.message;
      })

      // DELETE SINGLE
      .addCase(deleteComment.pending, (state) => {
        state.loading.delete = true;
        state.errorCode = null;
      })

      .addCase(deleteComment.fulfilled, (state, action) => {
        state.loading.delete = false;

        const { id, code } = action.payload;
        state.lastActionCode = code;

        const deletedComment = state.entities[id];
        if (!deletedComment) return;

        const { parentId } = deletedComment;

        // 1️⃣ Remove khỏi global entities
        commentsAdapter.removeOne(state, id);

        // 2️⃣ Remove khỏi byTarget
        Object.values(state.byTarget).forEach((target) => {
          target.ids = target.ids.filter((commentId) => commentId !== id);
        });

        // 3️⃣ Remove khỏi homeFeed
        state.homeFeed.ids = state.homeFeed.ids.filter(
          (commentId) => commentId !== id
        );

        // 4️⃣ Nếu là reply → remove khỏi repliesByParent
        if (parentId && state.repliesByParent[parentId]) {
          state.repliesByParent[parentId].ids = state.repliesByParent[
            parentId
          ].ids.filter((replyId) => replyId !== id);

          // giảm replyCount của parent
          const parent = state.entities[parentId];
          if (parent) {
            parent.replyCount = Math.max((parent.replyCount || 1) - 1, 0);
          }
        }
      })

      .addCase(deleteComment.rejected, (state, action) => {
        state.loading.delete = false;
        state.errorCode = action.payload?.code;
      })

      // DELETE MANY
      .addCase(deleteManyComments.pending, (state) => {
        state.loading.deleteMany = true;
        state.error = null;
      })
      .addCase(deleteManyComments.fulfilled, (state, action) => {
        state.loading.deleteMany = false;

        const { deletedIds, code } = action.payload;

        state.lastActionCode = code;

        commentsAdapter.removeMany(state, deletedIds);
      })
      .addCase(deleteManyComments.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(likeComment.pending, (state) => {
        // state.loading = true;
        state.error = null;
      })
      .addCase(likeComment.fulfilled, (state, action) => {
        const { commentId, likeCount, isLiked } = action.payload.data;

        const comment = state.entities[commentId];

        if (comment) {
          comment.likeCount = likeCount;
          comment.isLiked = isLiked;
        }
      })
      .addCase(likeComment.rejected, (state, action) => {
        const { commentId, prevIsLiked } = action.meta.arg;

        const comment = state.entities[commentId];
        if (!comment) return;

        comment.isLiked = prevIsLiked;
        comment.likeCount += prevIsLiked ? 1 : -1;
      })

      .addCase(reportComment.pending, (state) => {
        state.errorCode = null;
      })

      .addCase(reportComment.fulfilled, (state, action) => {
        const { commentId, report_count, code } = action.payload;

        state.lastActionCode = code;

        const comment = state.entities[commentId];

        if (comment) {
          comment.report_count = report_count;
        }
      })

      .addCase(reportComment.rejected, (state, action) => {
        state.errorCode = action.payload?.code;
      })

      .addCase(restoreComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreComment.fulfilled, (state, action) => {
        state.loading = false;
        // server trả về restored comment
        commentsAdapter.upsertOne(state, action.payload);
      })
      .addCase(restoreComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(uploadCommentAttachment.pending, (state) => {
        state.loading.uploadAttachment = true;
        state.error = null;
        state.lastUploaded = null;
      })
      .addCase(uploadCommentAttachment.fulfilled, (state, action) => {
        state.loading.uploadAttachment = false;
        state.lastUploaded = action.payload;
      })
      .addCase(uploadCommentAttachment.rejected, (state, action) => {
        state.loading.uploadAttachment = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(fetchMyComments.pending, (state) => {
        state.loading.myComments = true;
        state.error = null;
      })
      .addCase(fetchMyComments.fulfilled, (state, action) => {
        state.loading.myComments = false;
        state.myComments = action.payload || [];
        // Optionally upsert to global store
        commentsAdapter.upsertMany(state, action.payload || []);
      })
      .addCase(fetchMyComments.rejected, (state, action) => {
        state.loading.myComments = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(fetchCommentStats.pending, (state) => {
        // lightweight, don't toggle global loading? we still set error to null
        state.error = null;
      })
      .addCase(fetchCommentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchCommentStats.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      .addCase(previewExportComments.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportComments.fulfilled, (state, action) => {
        state.previewLoading = false;

        state.lastActionCode = action.payload.code;

        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportComments.rejected, (state, action) => {
        state.previewLoading = false;

        state.errorCode = action.payload?.code;
      })

      // ===== EXPORT COMMENTS =====

      .addCase(exportComments.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportComments.fulfilled, (state) => {
        state.loading.export = false;

        state.lastActionCode = "COMMENT_EXPORT_SUCCESS";
      })

      .addCase(exportComments.rejected, (state, action) => {
        state.loading.export = false;

        state.errorCode = action.payload?.code;
      });
  },
});

export const selectCommentsByTarget = (
  state,
  targetType,
  targetId,
  sort = "new"
) => {
  const key = `${targetType}_${targetId}_${sort}`;

  const target = state.comments.byTarget[key];

  if (!target) {
    return {
      comments: [],
      hasNext: false,
      nextPageToken: null,
    };
  }

  return {
    comments: target.ids.map((id) => state.comments.entities[id]),
    hasNext: target.hasNext,
    nextPageToken: target.nextPageToken,
  };
};

export const selectHomeComments = createSelector(
  [(state) => state.comments.homeFeed.ids, (state) => state.comments.entities],
  (ids, entities) => ids.map((id) => entities[id])
);

export const selectHomeFeedMeta = (state) => state.comments.homeFeed;

export const selectRepliesByParent = (state, parentId) => {
  const parent = state.comments.repliesByParent[parentId];

  if (!parent) {
    return {
      replies: [],
      nextPageToken: null,
    };
  }

  return {
    replies: parent.ids.map((id) => state.comments.entities[id]),
    nextPageToken: parent.nextPageToken,
  };
};
export const selectAdminComments = createSelector(
  [(state) => state.comments.lists.admin, (state) => state.comments.entities],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);

export const {
  clearSelectedComment,
  goToPrevPage,
  clearError,
  clearStats,
  clearMyComments,
  clearLastUploaded,
  optimisticLike,
} = commentsSlice.actions;
export default commentsSlice.reducer;

export const {
  selectAll: selectAllComments,
  selectById: selectCommentById,
  selectIds: selectCommentIds,
} = commentsAdapter.getSelectors((state) => state.comments);
export const selectCommentLoading = (state) => state.comments.loading;
export const selectAdminCommentsLoading = (state) =>
  state.comments.loading.admin;

export const selectCommentsByTargetLoading = (state) =>
  state.comments.loading.byTarget;

export const selectRepliesLoading = (state) => state.comments.loading.replies;

export const selectUploadAttachmentLoading = (state) =>
  state.comments.loading.uploadAttachment;

export const selectHomeCommentsLoading = (state) =>
  state.comments.homeFeed.loading;
