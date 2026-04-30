import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import { buildQueryString } from "../courses/coursesThunks";

// Lấy danh sách tin nhắn theo roomId
export const fetchRoomMessages = createAsyncThunk(
  "messages/roomList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { roomId, cursor = null, limit = 20, isLoadMore = false } = args;

      const params = buildQueryString({
        cursor,
        limit,
      });

      const res = await api.get(`/chat/rooms/${roomId}/messages?${params}`);

      return {
        ...res.data,
        roomId,
        isLoadMore,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);

export const fetchAdminMessages = createAsyncThunk(
  "messages/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, filters = {} } = args;

      const params = buildQueryString({
        page,
        limit,
        ...filters,
      });

      const res = await api.get(`/chat/messages?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

// Tạo tin nhắn mới
export const createMessage = createAsyncThunk(
  "messages/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/chat/messages", payload);

      const { code, data } = res.data;

      return {
        code,
        messageId: data.message.id,
      };
    } catch (err) {
      const res = err.response?.data;

      return rejectWithValue({
        code: res?.code || "SERVER_ERROR",
      });
    }
  }
);

// Cập nhật tin nhắn
export const updateMessage = createAsyncThunk(
  "messages/updateMessage",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;

      const res = await api.put(`/messages/${id}`, data);

      dispatch(
        addToast({
          type: "success",
          title: "Cập nhật tin nhắn",
          message: "Tin nhắn đã được cập nhật thành công!",
          duration: 5000,
        })
      );

      return res.data.data; // Trả về message mới (đúng với update controller)
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Cập nhật thất bại",
          message: err.response?.data?.message || "Lỗi khi cập nhật tin nhắn.",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Xóa (đánh dấu deleted) tin nhắn
export const deleteMessage = createAsyncThunk(
  "messages/deleteMessage",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/chat/messages/${id}`);

      dispatch(
        addToast({
          type: "success",
          title: "Xóa tin nhắn",
          message: "Tin nhắn đã được xóa thành công!",
          duration: 5000,
        })
      );

      return id; // Trả về id đã xóa
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Xóa thất bại",
          message: err.response?.data?.message || "Lỗi khi xóa tin nhắn.",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Thêm reaction
export const reactMessage = createAsyncThunk(
  "messages/reactMessage",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/messages/react", payload);

      dispatch(
        addToast({
          type: "success",
          title: "Thêm reaction",
          message: "Đã thêm reaction thành công!",
          duration: 5000,
        })
      );

      return res.data.messageData; // Trả về message đã update reaction
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Thêm reaction thất bại",
          message: err.response?.data?.message || "Lỗi khi thêm reaction.",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Xóa reaction
export const unreactMessage = createAsyncThunk(
  "messages/unreactMessage",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/messages/unreact", payload);

      dispatch(
        addToast({
          type: "success",
          title: "Xóa reaction",
          message: "Đã xóa reaction thành công!",
          duration: 5000,
        })
      );

      return res.data.messageData; // Trả về message đã update reaction
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Xóa reaction thất bại",
          message: err.response?.data?.message || "Lỗi khi xóa reaction.",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
// Thêm reply cho message
export const addReply = createAsyncThunk(
  "messages/addReply",
  async (payload, { dispatch, rejectWithValue }) => {
    // payload: { messageId, replyContent, ... }
    try {
      const res = await api.post("/messages/reply", payload);

      dispatch(
        addToast({
          type: "success",
          title: "Trả lời tin nhắn",
          message: "Đã thêm trả lời thành công!",
          duration: 5000,
        })
      );

      return res.data.message; // Trả về message đã cập nhật (có reply)
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Thêm trả lời thất bại",
          message: err.response?.data?.message || "Lỗi khi thêm trả lời.",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Đánh dấu vi phạm cho tin nhắn
export const markViolation = createAsyncThunk(
  "messages/markViolation",
  async ({ id, violationData }, { dispatch, rejectWithValue }) => {
    // violationData: thông tin vi phạm (lý do, mức độ,...)
    try {
      const res = await api.put(`/messages/${id}/violation`, violationData);

      dispatch(
        addToast({
          type: "success",
          title: "Đánh dấu vi phạm",
          message: "Tin nhắn đã được đánh dấu vi phạm thành công!",
          duration: 5000,
        })
      );

      return res.data.message; // Trả về message đã cập nhật
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Đánh dấu vi phạm thất bại",
          message: err.response?.data?.message || "Lỗi khi đánh dấu vi phạm.",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Xóa nhiều message (trong phòng chat)
export const removeManyMessages = createAsyncThunk(
  "messages/removeMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      // API xóa nhiều message: DELETE /api/messages với body { ids }
      await api.post("/messages/delete-many", { data: { ids } });

      dispatch(
        addToast({
          type: "success",
          title: "Xóa nhiều tin nhắn",
          message: "Các tin nhắn đã được xóa thành công!",
          duration: 5000,
        })
      );

      return ids; // Trả về mảng id đã xóa
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Xóa nhiều thất bại",
          message: err.response?.data?.message || "Lỗi khi xóa nhiều tin nhắn.",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
