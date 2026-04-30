import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import {
  exportCategoriesApi,
  previewExportCategoriesApi,
} from "../../app/categoriesApi";
import { buildQueryString } from "../courses/coursesThunks";
export const toastMap = {
  // ===== CATEGORY =====
  CATEGORY_CREATED: {
    type: "success",
    title: "Danh mục",
    message: "Tạo danh mục thành công",
  },

  CATEGORY_EXISTS: {
    type: "error",
    title: "Danh mục",
    message: "Danh mục đã tồn tại",
  },

  CATEGORY_INVALID: {
    type: "error",
    title: "Danh mục",
    message: "Dữ liệu danh mục không hợp lệ",
  },

  CATEGORY_CREATE_FAILED: {
    type: "error",
    title: "Danh mục",
    message: "Tạo danh mục thất bại",
  },

  CATEGORY_BULK_CREATED: {
    type: "success",
    title: "Import danh mục",
    message: "Import danh mục hoàn tất",
  },

  CATEGORY_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Import danh mục",
    message: "Danh sách import không hợp lệ",
  },

  CATEGORY_BULK_VALIDATION_FAILED: {
    type: "warning",
    title: "Import danh mục",
    message: "Có dòng dữ liệu không hợp lệ",
  },

  CATEGORY_BULK_DUPLICATE_IN_FILE: {
    type: "warning",
    title: "Import danh mục",
    message: "Có danh mục bị trùng trong file",
  },

  CATEGORY_BULK_CREATE_FAILED: {
    type: "error",
    title: "Import danh mục",
    message: "Import danh mục thất bại",
  },

  CATEGORY_UPDATE_SUCCESS: {
    type: "success",
    title: "Danh mục",
    message: "Cập nhật danh mục thành công",
  },

  CATEGORY_DELETE_SUCCESS: {
    type: "success",
    title: "Danh mục",
    message: "Xóa danh mục thành công",
  },
  CATEGORY_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Danh mục",
    message: "Không có danh mục để xóa",
  },

  CATEGORY_DELETE_PARTIAL_NOT_FOUND: {
    type: "error",
    title: "Danh mục",
    message: "Một số danh mục không tồn tại",
  },
  CATEGORY_NOT_FOUND: {
    type: "error",
    title: "Danh mục",
    message: "Không tìm thấy danh mục",
  },
  CATEGORY_EXPORT_PREVIEW_SUCCESS: {
    type: "success",
    title: "Danh mục",
    message: "Xem trước export danh mục thành công",
  },

  CATEGORY_EXPORT_SUCCESS: {
    type: "success",
    title: "Danh mục",
    message: "Xuất danh mục thành công",
  },

  CATEGORY_EXPORT_EMPTY: {
    type: "warning",
    title: "Danh mục",
    message: "Không có danh mục để export",
  },

  CATEGORY_EXPORT_SCOPE_INVALID: {
    type: "error",
    title: "Danh mục",
    message: "Phạm vi export không hợp lệ",
  },

  CATEGORY_EXPORT_SELECTED_EMPTY: {
    type: "error",
    title: "Danh mục",
    message: "Chưa chọn danh mục để export",
  },

  CATEGORY_EXPORT_FORMAT_INVALID: {
    type: "error",
    title: "Danh mục",
    message: "Định dạng export không hợp lệ",
  },

  // ===== SYSTEM =====
  SERVER_ERROR: {
    type: "error",
    title: "Hệ thống",
    message: "Có lỗi hệ thống xảy ra",
  },
};

// Lấy danh mục (giữ nguyên)
export const fetchCategories = createAsyncThunk(
  "categories/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,

        ...filters,
      });

      const res = await api.get(`/categories?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
export const fetchPublicCategories = createAsyncThunk(
  "categories/publicList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { cursor = null, limit = 30, filters = {} } = args;

      const params = buildQueryString({
        cursor,
        limit,
        ...filters,
      });

      const res = await api.get(`/categories/public?${params}`);

      return res.data;
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
export const fetchCategoryOptions = createAsyncThunk(
  "categories/options",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/categories/options");

      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
// Tạo danh mục
export const createCategory = createAsyncThunk(
  "categories/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/categories", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        category: data.category,
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

// Tạo nhiều danh mục
export const createManyCategories = createAsyncThunk(
  "categories/bulkCreate",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/categories/bulk", payloadList);

      const { code, data, summary } = res.data;

      // ===== toast theo code =====
      const baseToast = toastMap[code];
      if (baseToast) {
        dispatch(
          addToast({
            ...baseToast,
            message: `Tạo ${summary.created}/${summary.total} danh mục`,
          })
        );
      }

      // ===== toast warning nếu có skipped / failed =====
      if (summary.skipped > 0 || summary.failed > 0) {
        dispatch(
          addToast({
            type: "warning",
            title: "Import danh mục",
            message: `Bỏ qua ${summary.skipped}, lỗi ${summary.failed}`,
          })
        );
      }

      return {
        code,
        created: data.created,
        skipped: data.skipped,
        errors: data.errors,
        summary,
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

// Xóa nhiều danh mục
export const deleteManyCategories = createAsyncThunk(
  "categories/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/categories/delete-many", { ids });

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

// Cập nhật danh mục - **cập nhật trả về data mới**
export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      const res = await api.put(`/categories/${id}`, data);

      const { code, data: resData } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        category: resData.category,
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

/* =========================
   PREVIEW EXPORT CATEGORY
========================= */
export const previewExportCategories = createAsyncThunk(
  "categories/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportCategoriesApi(payload);
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

/* =========================
   EXPORT CATEGORY
========================= */
export const exportCategories = createAsyncThunk(
  "categories/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportCategoriesApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "categories_export";

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      dispatch(
        addToast(
          toastMap.CATEGORY_EXPORT_SUCCESS || {
            type: "success",
            message: "Xuất danh mục thành công",
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
