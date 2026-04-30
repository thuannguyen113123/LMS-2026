import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";

export const toastMap = {
  NOTIFICATION_SETTINGS_UPDATED: {
    type: "success",
    title: "Notification",
    message: "Cập nhật notification thành công",
  },
  NOTIFICATION_UPDATE_FAILED: {
    type: "error",
    title: "Notification",
    message: "Cập nhật notification thất bại",
  },
  NOTIFICATION_DELETE_SUCCESS: {
    type: "success",
    title: "Notification",
    message: "Xóa notification thành công",
  },

  NOTIFICATION_DELETE_FAILED: {
    type: "error",
    title: "Notification",
    message: "Xóa notification thất bại",
  },
};

export const fetchMyNotifications = createAsyncThunk(
  "notifications/fetchMy",
  async (args = {}, { rejectWithValue }) => {
    try {
      const {
        cursor = null,
        limit = 10,
        filter = "all", // ✅ thêm
        search = "",
        isLoadMore = false,
      } = args;

      const params = new URLSearchParams({
        limit,
        filter, // ✅ gửi lên backend
        ...(search && { search }), // ✅ thêm
        ...(cursor && { cursor }),
      });

      const res = await api.get(`/notifications?${params}`);

      return {
        ...res.data,
        isLoadMore,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const updateNotificationSettings = createAsyncThunk(
  "user/updateNotificationSettings",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.patch("/users/notification-settings", payload);

      const { code, data } = res.data;

      // ✅ Hiển thị toast nếu có map
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return data; // trả về settings mới
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const markNotificationsAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (ids = [], { rejectWithValue }) => {
    try {
      const res = await api.patch("/notifications/mark-read", { ids });
      return res.data.data.ids; // trả về mảng _id đã đánh dấu
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const fetchNotificationSettings = createAsyncThunk(
  "notifications/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/notifications/notification-settings");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
export const deleteManyNotifications = createAsyncThunk(
  "notifications/deleteMany",
  async (ids = [], { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/notifications/delete-many", {
        ids,
      });

      const { code, data } = res.data;

      // ✅ toast success
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "NOTIFICATION_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
