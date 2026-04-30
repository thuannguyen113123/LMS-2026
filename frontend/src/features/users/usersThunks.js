import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast, setTheme } from "../ui/uiSlice";
import { openModal } from "../modal/modalSlice";
import { exportUsersApi, previewExportUsersApi } from "../../app/userExportApi";
import { buildQueryString } from "../courses/coursesThunks";

export const userToastMap = {
  USER_BULK_INVALID_PAYLOAD: {
    type: "error",
    message: "Danh sách import không hợp lệ",
  },
  USER_IMPORT_FORBIDDEN_FIELD: {
    type: "error",
    message: "File import chứa field không được phép",
  },
  USER_BULK_VALIDATION_FAILED: {
    type: "error",
    message: "Dữ liệu trong file import không hợp lệ",
  },
  USER_ROLE_NOT_FOUND: {
    type: "error",
    message: "Role không tồn tại trong hệ thống",
  },
  USER_ALREADY_EXISTS: {
    type: "warning",
    message: "Một số user đã tồn tại",
  },
  USER_BULK_CREATE_FAILED: {
    type: "error",
    message: "Import user thất bại",
  },

  USER_ADMIN_FORM_UPDATED: {
    type: "success",
    message: "Cập nhật user thành công",
  },

  USER_ADMIN_FORM_UPDATE_FAILED: {
    type: "error",
    message: "Cập nhật user thất bại",
  },

  USER_ADMIN_INLINE_UPDATED: {
    type: "success",
    message: "Cập nhật nhanh thành công",
  },

  USER_ADMIN_INLINE_UPDATE_FAILED: {
    type: "error",
    message: "Cập nhật nhanh thất bại",
  },

  USER_ADMIN_INLINE_INVALID_FIELD: {
    type: "error",
    message: "Field inline không hợp lệ",
  },

  USER_DELETE_MANY_SUCCESS: {
    type: "success",
    message: "Xóa người dùng thành công",
  },

  USER_DELETE_MANY_INVALID_PAYLOAD: {
    type: "error",
    message: "Danh sách xóa không hợp lệ",
  },

  USER_DELETE_MANY_NOT_FOUND: {
    type: "error",
    message: "Có người dùng không tồn tại",
  },

  USER_DELETE_MANY_FAILED: {
    type: "error",
    message: "Xóa người dùng thất bại",
  },

  // CREATE SINGLE USER (giữ nguyên)
  ADMIN_CREATE_USER_SUCCESS: {
    type: "success",
    message: "Tạo user thành công",
  },

  // ===== EXPORT =====

  USER_EXPORT_PREVIEW_SUCCESS: {
    type: "success",
    message: "Xem trước export user thành công",
  },

  USER_EXPORT_SUCCESS: {
    type: "success",
    message: "Xuất danh sách user thành công",
  },

  USER_EXPORT_EMPTY: {
    type: "warning",
    message: "Không có user để export",
  },

  USER_EXPORT_SCOPE_INVALID: {
    type: "error",
    message: "Scope export không hợp lệ",
  },

  USER_EXPORT_SELECTED_EMPTY: {
    type: "error",
    message: "Chưa chọn user để export",
  },

  USER_EXPORT_FORMAT_INVALID: {
    type: "error",
    message: "Format export không hợp lệ",
  },
  CONTACT_INVALID: {
    type: "error",
    message: "Phải có email hoặc số điện thoại hợp lệ",
  },
  USER_EXISTS: {
    type: "error",
    message: "Người dùng đã tồn tại",
  },
  ROLE_NOT_FOUND: {
    type: "error",
    message: "Role không tồn tại",
  },
  SERVER_ERROR: {
    type: "error",
    message: "Lỗi hệ thống",
  },
  USER_PROFILE_SUCCESS: {
    type: "success",
    message: "Tải hồ sơ người dùng thành công",
  },

  USER_PROFILE_NOT_FOUND: {
    type: "error",
    message: "Không tìm thấy hồ sơ",
  },
  USER_PREFERENCES_UPDATED: {
    type: "success",
    message: "Cập nhật giao diện thành công",
  },
};

// Fetch all users (admin)
export const fetchUsers = createAsyncThunk(
  "users/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, role = "all", search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        role,
        search,
      });

      const res = await api.get(`/users?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchMyProfile = createAsyncThunk(
  "auth/fetchMyProfile",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get("/users/profile");

      return res.data;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.response?.data?.message || "Không tải được hồ sơ",
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);
export const fetchProfileBySlug = createAsyncThunk(
  "users/fetchProfileBySlug",
  async ({ slug, type }, { dispatch, rejectWithValue }) => {
    try {
      let url = `/users/profile/${slug}`;

      if (type) {
        url += `?type=${type}`;
      }

      const res = await api.get(url);

      const { code, data } = res.data;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        profile: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);
// Fetch user by id
export const fetchUserById = createAsyncThunk(
  "users/fetchUserById",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/users/${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// usersThunks.js (thêm đoạn này nếu chưa có)
export const createUser = createAsyncThunk(
  "users/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/users", payload);
      const { code, data } = res.data;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      //  Điều hướng flow (OTP / Email)
      if (data?.nextStep === "set-password-otp") {
        dispatch(
          openModal({
            key: "auth",
            data: {
              initialStep: "otp",
              otpPurpose: "set-password",
              phone: payload.phone,
            },
          })
        );
      }

      return {
        code,
        user: data.user,
        nextStep: data.nextStep,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

//Thêm nhiêu user
export const createManyUsers = createAsyncThunk(
  "users/createManyUsers",
  async (usersData, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/users/bulk", usersData);
      const { data, code } = res.data;
      const { summary } = data;

      let toastType = "success";
      let toastTitle = "Import users";

      if (summary.created === 0 && summary.failed > 0) {
        toastType = "error";
        toastTitle = "Import users thất bại";
      } else if (summary.failed > 0) {
        toastType = "warning";
        toastTitle = "Import users (một phần)";
      }

      dispatch(
        addToast({
          type: toastType,
          title: toastTitle,
          message: `Tổng: ${summary.total} | Tạo: ${summary.created} | Bỏ qua: ${summary.skipped} | Lỗi: ${summary.failed}`,
          duration: 6000,
        })
      );

      return {
        code,
        users: data.created,
        bulk: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || userToastMap.USER_BULK_CREATE_FAILED;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const adminInlineUpdate = createAsyncThunk(
  "users/adminInlineUpdate",
  async ({ userId, patch }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.patch(`/users/${userId}/inline`, patch);

      const { code, data } = res.data;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, user: data };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const adminFormUpdate = createAsyncThunk(
  "users/adminFormUpdate",
  async ({ userId, data }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(`/users/${userId}`, data);
      const { code, data: user } = res.data;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, user };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const updateThemeApi = createAsyncThunk(
  "auth/updateTheme",
  async (theme, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.patch("/users/preferences", { theme });
      dispatch(setTheme(theme));

      const { code, data } = res.data;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preferences: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// // Update own profile
export const updateMyProfile = createAsyncThunk(
  "users/updateMyProfile",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put("/users/me", data);

      dispatch(
        addToast({
          type: "success",
          message: res.data.message || "Cập nhật hồ sơ thành công",
        })
      );

      return res.data.user;
    } catch (err) {
      const message = err.response?.data?.message || err.message;

      dispatch(addToast({ type: "error", message }));

      return rejectWithValue(message);
    }
  }
);

export const deleteManyUsers = createAsyncThunk(
  "users/deleteManyUsers",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/users/delete-many", { ids });

      const { code, data } = res.data;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || userToastMap.USER_DELETE_MANY_FAILED;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const previewExportUsers = createAsyncThunk(
  "users/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportUsersApi(payload);
      const { code, data } = res.data;

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, preview: data };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const exportUsers = createAsyncThunk(
  "users/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportUsersApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "users_export";

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      dispatch(
        addToast(
          userToastMap.USER_EXPORT_SUCCESS || {
            type: "success",
            message: "Xuất user thành công",
          }
        )
      );

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = userToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 🔍 TÌM KIẾM GỢI Ý USER
export const searchUsersForRoom = createAsyncThunk(
  "users/searchUsersForRoom",
  async (
    {
      query = "",
      excludeIds = [],
      limit = 10,
      startAfterId = null,
      isNextPage = false,
    },
    { rejectWithValue }
  ) => {
    try {
      const params = buildQueryString({
        query,
        excludeIds,
        limit,
        startAfterId,
      });

      const res = await api.get(`/users/search?${params}`);

      return {
        data: res.data.users || [],
        pagination: res.data.pagination,
        code: res.data.code,
        isNextPage,
        startAfterId,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "USER_SEARCH_FAILED",
      });
    }
  }
);
