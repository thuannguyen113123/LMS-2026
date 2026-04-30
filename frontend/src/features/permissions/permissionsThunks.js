import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";
import {
  exportPermissionsApi,
  previewExportPermissionsApi,
} from "../../app/permission.api";
import { buildQueryString } from "../courses/coursesThunks";

export const permissionToastMap = {
  PERMISSION_CREATED: {
    type: "success",
    message: "Quyền đã được tạo thành công",
  },

  PERMISSION_UPDATED: {
    type: "success",
    message: "Quyền đã được cập nhật thành công",
  },
  PERMISSION_NOT_FOUND: {
    type: "error",
    message: "Không tìm thấy quyền",
  },

  PERMISSION_INVALID_PAYLOAD: {
    type: "error",
    message: "Dữ liệu quyền không hợp lệ",
  },

  PERMISSION_CODE_EXISTED: {
    type: "error",
    message: "Mã quyền đã tồn tại",
  },

  // ===== CREATE MANY / BULK =====
  PERMISSION_BULK_CREATED: {
    type: "success",
    message: "Import quyền thành công",
  },

  PERMISSION_BULK_DELETED: {
    type: "success",
    message: "Các quyền đã được xóa",
  },
  PERMISSION_EXPORT_PREVIEW_SUCCESS: {
    type: "success",
    message: "Xem trước export quyền thành công",
  },

  PERMISSION_EXPORT_SUCCESS: {
    type: "success",
    message: "Xuất danh sách quyền thành công",
  },

  PERMISSION_EXPORT_EMPTY: {
    type: "warning",
    message: "Không có quyền nào để export",
  },

  PERMISSION_EXPORT_SCOPE_INVALID: {
    type: "error",
    message: "Phạm vi export không hợp lệ",
  },

  PERMISSION_EXPORT_SELECTED_EMPTY: {
    type: "error",
    message: "Chưa chọn quyền để export",
  },

  PERMISSION_EXPORT_FORMAT_INVALID: {
    type: "error",
    message: "Định dạng export không hợp lệ",
  },
  PERMISSION_BULK_INVALID_PAYLOAD: {
    type: "error",
    message: "Danh sách quyền không hợp lệ",
  },

  PERMISSION_BULK_VALIDATION_FAILED: {
    type: "error",
    message: "Dữ liệu import không hợp lệ",
  },

  PERMISSION_DUPLICATE_IN_FILE: {
    type: "warning",
    message: "Có quyền bị trùng trong file import",
  },

  PERMISSION_ALREADY_EXISTS: {
    type: "warning",
    message: "Một số quyền đã tồn tại",
  },

  PERMISSION_BULK_CREATE_FAILED: {
    type: "error",
    message: "Import quyền thất bại",
  },
};

export const fetchPermissions = createAsyncThunk(
  "permissions/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search = "", filters = {} } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/permissions?${params}`);

      return {
        data: res.data.data,
        pagination: res.data.pagination,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
// CREATE
export const createPermission = createAsyncThunk(
  "permissions/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/permissions", payload);

      const { code, data } = res.data;

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, permission: data };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// features/permissions/permission.thunks.js
export const createManyPermissions = createAsyncThunk(
  "permissions/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/permissions/bulk", payloadList);

      const { code, data, summary } = res.data;

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        created: data.created,
        skipped: data.skipped,
        errors: data.errors,
        summary,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "PERMISSION_BULK_CREATE_FAILED";

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// permissionsThunks.js
export const deleteManyPermissions = createAsyncThunk(
  "permissions/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/permissions/delete-many", { ids });

      const { code, data } = res.data;

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return data; // deletedIds
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// UPDATE
export const updatePermission = createAsyncThunk(
  "permissions/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      const res = await api.put(`/permissions/${id}`, data);

      const { code, data: permission } = res.data;

      const toast = permissionToastMap[code];
      if (toast) {
        dispatch(addToast({ ...toast, title: "Cập nhật quyền" }));
      }

      return permission;
    } catch (err) {
      const code = err.response?.data?.code;

      const toast = permissionToastMap[code];
      dispatch(
        addToast(
          toast || {
            type: "error",
            title: "Cập nhật thất bại",
            message: "Lỗi khi cập nhật quyền",
          }
        )
      );

      return rejectWithValue(code);
    }
  }
);

export const previewExportPermissions = createAsyncThunk(
  "permissions/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportPermissionsApi(payload);
      const { code, data } = res.data;

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, preview: data };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const exportPermissions = createAsyncThunk(
  "permissions/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportPermissionsApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "permissions_export";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      dispatch(
        addToast(
          permissionToastMap.PERMISSION_EXPORT_SUCCESS || {
            type: "success",
            message: "Xuất quyền thành công",
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

      const toast = permissionToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
