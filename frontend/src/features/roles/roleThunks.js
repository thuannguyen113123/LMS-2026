import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import { exportRolesApi, previewExportRolesApi } from "../../app/role.api";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  // ROLE
  ROLE_CREATED: {
    type: "success",
    message: "Role đã được tạo thành công",
  },
  ROLE_NAME_REQUIRED: {
    type: "error",
    message: "Tên role không được để trống",
  },
  // Bulk
  ROLE_BULK_INVALID_PAYLOAD: {
    type: "error",
    message: "Danh sách role không hợp lệ",
  },
  ROLE_BULK_CREATE_FAILED: {
    type: "error",
    message: "Import roles thất bại",
  },

  ROLE_DELETE_MANY_SUCCESS: {
    type: "success",
    message: "Đã xóa các role được chọn",
  },
  ROLE_DELETE_MANY_INVALID_PAYLOAD: {
    type: "error",
    message: "Danh sách role không hợp lệ",
  },
  ROLE_DELETE_MANY_NOT_FOUND: {
    type: "error",
    message: "Một hoặc nhiều role không tồn tại",
  },
  ROLE_DELETE_MANY_FAILED: {
    type: "error",
    message: "Xóa nhiều role thất bại",
  },
  // EXPORT
  ROLE_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    message: "Xem trước dữ liệu export",
  },
  ROLE_EXPORT_EMPTY: {
    type: "warning",
    message: "Không có dữ liệu để export",
  },
  ROLE_EXISTS: {
    type: "error",
    message: "Role đã tồn tại",
  },
  ROLE_INVALID: {
    type: "error",
    message: "Role không hợp lệ",
  },
};

export const fetchRoles = createAsyncThunk(
  "roles/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/roles?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

// Create role
export const createRole = createAsyncThunk(
  "roles/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/roles", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, role: data };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// Create many roles
export const createManyRoles = createAsyncThunk(
  "roles/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/roles/bulk", payloadList);
      const { code, summary } = res.data;

      dispatch(
        addToast({
          type: summary.failed > 0 ? "warning" : "success",
          title: "Import roles",
          message: `Tổng: ${summary.total} | Tạo: ${summary.created} | Bỏ qua: ${summary.skipped} | Lỗi: ${summary.failed}`,
          duration: 6000,
        })
      );

      return {
        code,
        roles: res.data.data.created,
        bulk: {
          summary: res.data.summary,
          skipped: res.data.data.skipped,
          errors: res.data.data.errors,
        },
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "ROLE_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// Delete many roles
export const deleteManyRoles = createAsyncThunk(
  "roles/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/roles/delete-many", { ids });
      const { code } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: res.data.data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "ROLE_DELETE_MANY_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// Update role
export const updateRole = createAsyncThunk(
  "roles/updateRole",
  async ({ id, ...data }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(`/roles/${id}`, data);

      dispatch(
        addToast({
          type: "success",
          title: "Cập nhật",
          message: res.data.message,
        })
      );

      return res.data.data; // 👈 updated role từ DB
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Lỗi khi cập nhật role";

      dispatch(
        addToast({
          type: "error",
          title: "Cập nhật thất bại",
          message: errorMessage,
        })
      );

      return rejectWithValue(errorMessage);
    }
  }
);

// roleThunks.js
export const previewExportRoles = createAsyncThunk(
  "roles/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportRolesApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, preview: data };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const exportRoles = createAsyncThunk(
  "roles/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportRolesApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "export";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      dispatch(
        addToast(
          toastMap.ROLE_EXPORT_SUCCESS || {
            type: "success",
            message: "Xuất file thành công",
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

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
