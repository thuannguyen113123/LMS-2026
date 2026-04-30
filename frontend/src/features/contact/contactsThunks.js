import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  CONTACT_CREATED: {
    type: "success",
    title: "Liên hệ",
    message: "Gửi liên hệ thành công",
  },

  CONTACT_FETCH_FAILED: {
    type: "error",
    title: "Liên hệ",
    message: "Không tải được danh sách liên hệ",
  },

  SERVER_ERROR: {
    type: "error",
    title: "Hệ thống",
    message: "Có lỗi hệ thống xảy ra",
  },
  CONTACTS_DELETED: {
    type: "success",
    title: "Liên hệ",
    message: "Đã xóa các liên hệ đã chọn",
  },
  CONTACT_STATUS_UPDATED: {
    type: "success",
    title: "Liên hệ",
    message: "Đã cập nhật trạng thái",
  },
};

export const fetchContactsAdmin = createAsyncThunk(
  "contacts/adminList",
  async (args = {}, { dispatch, rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search, status, sort, from, to } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        status,
        sort,
        from,
        to,
      });

      const res = await api.get(`/contact?${params}`);

      // ✅ ADAPT RESPONSE HERE (IMPORTANT)
      return {
        contacts: res.data.contacts,
        pagination: res.data.pagination,
      };
    } catch (err) {
      const code = err.response?.data?.code || "CONTACT_FETCH_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const createContact = createAsyncThunk(
  "contacts/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/contact", payload);

      dispatch(addToast(toastMap.CONTACT_CREATED));

      return res.data.data;
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const updateContactStatus = createAsyncThunk(
  "contacts/updateStatus",
  async ({ id, status }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.patch(`/contact/${id}/status`, {
        status,
      });

      dispatch(addToast(toastMap.CONTACT_STATUS_UPDATED));

      return res.data.data;
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const deleteManyContacts = createAsyncThunk(
  "contacts/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/contact/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
