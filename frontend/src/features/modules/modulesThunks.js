import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import {
  exportModulesApi,
  previewExportModulesApi,
} from "../../app/modules.api";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  // ===== MODULE =====
  MODULE_CREATED: {
    type: "success",
    title: "Module",
    message: "Tạo module thành công",
  },

  MODULE_EXISTS: {
    type: "error",
    title: "Module",
    message: "Module đã tồn tại",
  },

  MODULE_CREATE_FAILED: {
    type: "error",
    title: "Module",
    message: "Tạo module thất bại",
  },

  MODULE_UPDATE_SUCCESS: {
    type: "success",
    title: "Module",
    message: "Cập nhật module thành công",
  },

  MODULE_UPDATE_FAILED: {
    type: "error",
    title: "Module",
    message: "Cập nhật module thất bại",
  },

  MODULE_DELETE_SUCCESS: {
    type: "success",
    title: "Module",
    message: "Xóa module thành công",
  },

  MODULE_DELETE_SYSTEM_FORBIDDEN: {
    type: "warning",
    title: "Module",
    message: "Không được xóa module hệ thống",
  },

  MODULE_TOGGLE_SUCCESS: {
    type: "success",
    title: "Module",
    message: "Cập nhật trạng thái module thành công",
  },

  MODULE_TOGGLE_FAILED: {
    type: "error",
    title: "Module",
    message: "Cập nhật trạng thái module thất bại",
  },

  MODULE_TOGGLE_INVALID: {
    type: "warning",
    title: "Module",
    message: "Giá trị trạng thái không hợp lệ",
  },
  MODULE_DELETE_MANY_SUCCESS: {
    type: "success",
    title: "Module",
    message: "Xóa module thành công",
  },

  MODULE_DELETE_MANY_FAILED: {
    type: "error",
    title: "Module",
    message: "Xóa module thất bại",
  },

  MODULE_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Module",
    message: "Không có module để xóa",
  },
  MODULE_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Module",
    message: "Đã tạo dữ liệu xem trước export",
  },

  MODULE_EXPORT_SUCCESS: {
    type: "success",
    title: "Module",
    message: "Xuất module thành công",
  },

  MODULE_EXPORT_EMPTY: {
    type: "warning",
    title: "Module",
    message: "Không có dữ liệu để export",
  },

  MODULE_EXPORT_SCOPE_INVALID: {
    type: "error",
    title: "Module",
    message: "Phạm vi export không hợp lệ",
  },

  MODULE_EXPORT_SELECTED_EMPTY: {
    type: "warning",
    title: "Module",
    message: "Chưa chọn module để export",
  },

  MODULE_EXPORT_FORMAT_INVALID: {
    type: "error",
    title: "Module",
    message: "Định dạng export không hợp lệ",
  },
  MODULE_SIDEBAR_SUCCESS: {
    type: "info",
    title: "Module",
    message: "Tải sidebar thành công",
  },

  MODULE_SIDEBAR_FAILED: {
    type: "error",
    title: "Module",
    message: "Tải sidebar thất bại",
  },
};

export const fetchModules = createAsyncThunk(
  "modules/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/modules?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "MODULE_LIST_FAILED",
      });
    }
  }
);

export const fetchSidebarModules = createAsyncThunk(
  "modules/fetchSidebar",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get("/modules/sidebar");

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        modules: data.modules,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "MODULE_SIDEBAR_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/**
 * ======================
 * ➕ CREATE MODULE
 * ======================
 */
export const createModule = createAsyncThunk(
  "modules/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/modules", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        module: data.module,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "MODULE_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/**
 * ======================
 * ✏️ UPDATE MODULE
 * ======================
 */
export const updateModule = createAsyncThunk(
  "modules/update",
  async ({ id, ...data }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(`/modules/${id}`, data);

      const { code, data: resData } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        module: resData.module,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "MODULE_UPDATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/**
 * ======================
 * 🔁 TOGGLE ACTIVE
 * ======================
 */
export const toggleModuleActive = createAsyncThunk(
  "modules/toggleActive",
  async ({ id, isActive }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(`/modules/toggle/${id}`, { isActive });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        module: data.module,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "MODULE_TOGGLE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/**
 * ======================
 * ↕️ UPDATE ORDER
 * ======================
 */
export const updateModuleOrder = createAsyncThunk(
  "modules/updateOrder",
  async (items, { dispatch, rejectWithValue }) => {
    try {
      await api.put("/modules/order", { items });

      dispatch(
        addToast({
          type: "success",
          message: "Cập nhật thứ tự menu thành công",
        })
      );

      return items; // [{id, order}]
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: "Cập nhật thứ tự menu thất bại",
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const deleteManyModules = createAsyncThunk(
  "modules/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/modules/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        ids: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "MODULE_DELETE_MANY_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const previewExportModules = createAsyncThunk(
  "modules/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportModulesApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
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
export const exportModules = createAsyncThunk(
  "modules/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportModulesApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "modules_export";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.MODULE_EXPORT_SUCCESS || {
        type: "success",
        message: "Xuất module thành công",
      };

      dispatch(addToast(toast));

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
