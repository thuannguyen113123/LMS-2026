import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";
import {
  exportCommentsApi,
  previewExportCommentsApi,
} from "../../app/commentApi";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  COMMENT_CREATED: {
    type: "success",
    title: "Thành công",
    message: "Bình luận đã được tạo",
    duration: 5000,
  },

  COMMENT_CREATE_FAILED: {
    type: "error",
    title: "Thất bại",
    message: "Tạo bình luận thất bại",
    duration: 5000,
  },

  COMMENT_INVALID_CONTENT: {
    type: "error",
    title: "Không hợp lệ",
    message: "Nội dung bình luận không hợp lệ",
    duration: 5000,
  },

  COMMENT_INVALID_TARGET: {
    type: "error",
    title: "Không hợp lệ",
    message: "Target không hợp lệ",
    duration: 5000,
  },
  COMMENT_LIKED: {
    type: "success",
    title: "Bình luận",
    message: "Đã thích bình luận",
  },

  COMMENT_UNLIKED: {
    type: "info",
    title: "Bình luận",
    message: "Đã bỏ thích bình luận",
  },

  COMMENT_LIKE_FAILED: {
    type: "error",
    title: "Bình luận",
    message: "Không thể thích bình luận",
  },
  COMMENT_REPORT_SUCCESS: {
    type: "success",
    title: "Bình luận",
    message: "Báo cáo bình luận thành công",
  },

  COMMENT_ALREADY_REPORTED: {
    type: "info",
    title: "Bình luận",
    message: "Bạn đã báo cáo bình luận này rồi",
  },

  COMMENT_REPORT_FAILED: {
    type: "error",
    title: "Bình luận",
    message: "Không thể báo cáo bình luận",
  },

  COMMENT_DELETE_SUCCESS: {
    type: "success",
    title: "Bình luận",
    message: "Xoá bình luận thành công",
  },

  COMMENT_DELETE_FAILED: {
    type: "error",
    title: "Bình luận",
    message: "Xoá bình luận thất bại",
  },

  COMMENT_DELETE_FORBIDDEN: {
    type: "error",
    title: "Bình luận",
    message: "Bạn không có quyền xoá bình luận này",
  },
  COMMENT_DELETE_MANY_SUCCESS: {
    type: "success",
    title: "Bình luận",
    message: "Xoá các bình luận thành công",
  },

  COMMENT_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Bình luận",
    message: "Chưa chọn bình luận để xoá",
  },

  COMMENT_DELETE_MANY_FAILED: {
    type: "error",
    title: "Bình luận",
    message: "Xoá bình luận thất bại",
  },
  // ===== COMMENT EXPORT =====

  COMMENT_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Bình luận",
    message: "Đã tạo dữ liệu xem trước export",
  },

  COMMENT_EXPORT_SUCCESS: {
    type: "success",
    title: "Bình luận",
    message: "Xuất bình luận thành công",
  },

  COMMENT_EXPORT_EMPTY: {
    type: "warning",
    title: "Bình luận",
    message: "Không có dữ liệu để export",
  },

  COMMENT_EXPORT_FAILED: {
    type: "error",
    title: "Bình luận",
    message: "Xuất bình luận thất bại",
  },

  COMMENT_EXPORT_SCOPE_INVALID: {
    type: "error",
    title: "Bình luận",
    message: "Phạm vi export không hợp lệ",
  },

  COMMENT_EXPORT_SELECTED_EMPTY: {
    type: "warning",
    title: "Bình luận",
    message: "Chưa chọn bình luận để export",
  },

  COMMENT_EXPORT_FORMAT_INVALID: {
    type: "error",
    title: "Bình luận",
    message: "Định dạng export không hợp lệ",
  },
};

export const fetchComments = createAsyncThunk(
  "comments/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/comments?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchHomeComments = createAsyncThunk(
  "comments/fetchHomeComments",
  async ({ limit = 10, nextPageToken = null }) => {
    const res = await api.get("/comments/testimonials", {
      params: {
        limit,
        startAfterId: nextPageToken,
      },
    });

    return {
      data: res.data.data,
      nextPageToken: res.data.pagination.nextPageToken,
      isNextPage: !!nextPageToken,
    };
  },
  {
    getPendingMeta: () => ({ page: true }),
  },
  {
    condition: (_, { getState }) => {
      const { initialized, loading } = getState().comments.homeFeed;

      if (initialized || loading) {
        return false;
      }
    },
  }
);

// 🚀 Lấy bình luận theo targetType + targetId (course | lesson | ...)
export const fetchCommentsByTarget = createAsyncThunk(
  "comments/fetchByTarget",
  async (
    {
      targetType,
      targetId,
      startAfterId = null,
      limit = 10,
      sort: sortType,
      isNextPage = false,
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/comments/${targetType}/${targetId}`, {
        params: {
          startAfterId,
          limit,
          sort: sortType,
        },
      });

      const { comments, pagination } = res.data;

      // ⭐ FIX mapping backend -> frontend
      const mappedComments = comments.map((c) => ({
        ...c,
        id: c.id || c._id,
        likeCount: c.like_count ?? 0,
        reportCount: c.reportCount ?? c.report_count ?? 0,
      }));

      return {
        targetType,
        targetId,
        data: mappedComments,
        nextPageToken: pagination?.nextPageToken ?? null,
        hasNext: pagination?.hasNext ?? false,
        isNextPage,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.code || err.message);
    }
  }
);

// ✅ Lấy replies theo parentId (không cần phân trang)
export const fetchRepliesByParent = createAsyncThunk(
  "comments/fetchReplies",
  async ({ parentId, nextPageToken = null }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/comments/replies/${parentId}`, {
        params: { startAfterId: nextPageToken },
      });

      return {
        parentId,
        replies: res.data.data.replies,
        nextPageToken: res.data.data.nextPageToken,
      };
    } catch (err) {
      const res = err.response?.data;

      return rejectWithValue({
        code: res?.code || "COMMENT_LIST_FAILED",
        message: res?.message || err.message,
      });
    }
  }
);

// ✅ Lấy bình luận theo id
export const fetchCommentById = createAsyncThunk(
  "comments/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/comments/${id}`);
      return res.data.comment;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// ✅ Tạo bình luận mới
export const createComment = createAsyncThunk(
  "comments/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/comments", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        comment: data.comment,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COMMENT_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ✅ Cập nhật bình luận
export const updateComment = createAsyncThunk(
  "comments/update",
  async ({ id, ...data }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(`/comments/${id}`, data);

      dispatch(
        addToast({
          type: "success",
          title: "Cập nhật",
          message: "Bình luận đã được cập nhật!",
          duration: 5000,
        })
      );

      return res.data.comment;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Lỗi cập nhật",
          message: err.response?.data?.error || "Lỗi cập nhật bình luận.",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// ✅ Xoá bình luận theo ID
export const deleteComment = createAsyncThunk(
  "comments/delete",
  async (commentId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.delete(`/comments/${commentId}`);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        id: data.id,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COMMENT_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ✅ Xoá nhiều bình luận
export const deleteManyComments = createAsyncThunk(
  "comments/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/comments/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COMMENT_DELETE_MANY_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 🔹 LIKE / UNLIKE COMMENT                                                   */
/* -------------------------------------------------------------------------- */
export const likeComment = createAsyncThunk(
  "comments/like",
  async ({ commentId, isLiked }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/comments/${commentId}/like`, { isLiked });

      const { code, data } = res.data;

      return {
        code,
        data: {
          commentId: data.commentId,
          likeCount: data.like_count, // convert
          isLiked: data.isLiked,
        },
      };
    } catch (err) {
      console.log(err);

      return rejectWithValue({ code: "COMMENT_LIKE_FAILED" });
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 🔹 REPORT COMMENT                                                          */
/* -------------------------------------------------------------------------- */
export const reportComment = createAsyncThunk(
  "comments/report",
  async ({ commentId, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/comments/${commentId}/report`, {
        reason,
      });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        commentId,
        report_count: data.report_count,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "COMMENT_REPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 🔹 RESTORE COMMENT (ADMIN) - trả về comment đã khôi phục                    */
/* -------------------------------------------------------------------------- */
export const restoreComment = createAsyncThunk(
  "comments/restore",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/comments/${id}/restore`);

      dispatch(
        addToast({
          type: "success",
          title: "Khôi phục",
          message: "Bình luận đã được khôi phục.",
          duration: 4000,
        })
      );

      // Server trả về comment được restore
      return res.data.comment;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Khôi phục thất bại",
          message:
            err.response?.data?.error || "Không thể khôi phục bình luận.",
          duration: 4000,
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 🔹 UPLOAD ATTACHMENT                                                       */
/* -------------------------------------------------------------------------- */
export const uploadCommentAttachment = createAsyncThunk(
  "comments/uploadAttachment",
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/comments/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      dispatch(
        addToast({
          type: "success",
          title: "Đã tải lên",
          message: "Tệp đính kèm đã được tải lên.",
          duration: 3000,
        })
      );

      return res.data.file; // { url, filename, size, mimeType, ... }
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Upload thất bại",
          message: err.response?.data?.error || "Không thể upload tệp.",
          duration: 4000,
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 🔹 FETCH MY COMMENTS                                                       */
/* -------------------------------------------------------------------------- */
export const fetchMyComments = createAsyncThunk(
  "comments/fetchMy",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get("/comments/my");

      return res.data.comments;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Lỗi",
          message:
            err.response?.data?.error || "Không thể lấy bình luận của bạn.",
          duration: 4000,
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 🔹 FETCH COMMENT STATS FOR COURSE                                          */
/* -------------------------------------------------------------------------- */
export const fetchCommentStats = createAsyncThunk(
  "comments/fetchStats",
  async (courseId, { rejectWithValue }) => {
    try {
      // no loading here, it's a lightweight stat but we can startLoading if needed
      const res = await api.get(`/comments/stats/${courseId}`);
      return res.data.stats; // { totalComments, totalLikes, totalReports, topComments? }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const previewExportComments = createAsyncThunk(
  "comments/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportCommentsApi(payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;

      const code = res?.code || "COMMENT_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const exportComments = createAsyncThunk(
  "comments/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportCommentsApi(payload);

      const contentType = res.headers["content-type"];

      const disposition = res.headers["content-disposition"];

      let fileName = "comments_export";

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);

        if (match) fileName = match[1];
      }

      const toast = toastMap.COMMENT_EXPORT_SUCCESS;

      if (toast) dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;

      const code = res?.code || "COMMENT_EXPORT_FAILED";

      const toast = toastMap[code];

      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
