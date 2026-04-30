import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import {
  exportInstructorsApi,
  previewExportInstructorsApi,
} from "../../app/instructor.api";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  INSTRUCTOR_CREATED: {
    type: "success",
    title: "Giảng viên",
    message: "Tạo giảng viên thành công",
  },

  INSTRUCTOR_CREATE_FAILED: {
    type: "error",
    title: "Giảng viên",
    message: "Tạo giảng viên thất bại",
  },

  INSTRUCTOR_UPDATED: {
    type: "success",
    title: "Giảng viên",
    message: "Cập nhật giảng viên thành công",
  },

  INSTRUCTOR_UPDATE_FAILED: {
    type: "error",
    title: "Giảng viên",
    message: "Cập nhật giảng viên thất bại",
  },

  INSTRUCTOR_DELETE_SUCCESS: {
    type: "success",
    title: "Giảng viên",
    message: "Xóa giảng viên thành công",
  },

  INSTRUCTOR_DELETE_FAILED: {
    type: "error",
    title: "Giảng viên",
    message: "Xóa giảng viên thất bại",
  },

  INSTRUCTOR_NOT_FOUND: {
    type: "error",
    title: "Giảng viên",
    message: "Không tìm thấy giảng viên",
  },

  INSTRUCTOR_ALREADY_EXISTS: {
    type: "warning",
    title: "Giảng viên",
    message: "Giảng viên đã tồn tại",
  },

  // ===== INSTRUCTOR BULK =====

  INSTRUCTOR_BULK_CREATED: {
    type: "success",
    title: "Giảng viên",
    message: "Import giảng viên thành công",
  },

  INSTRUCTOR_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Giảng viên",
    message: "Danh sách giảng viên không hợp lệ",
  },

  INSTRUCTOR_BULK_VALIDATION_FAILED: {
    type: "warning",
    title: "Giảng viên",
    message: "Có dòng giảng viên không hợp lệ",
  },

  INSTRUCTOR_DUPLICATE_IN_FILE: {
    type: "warning",
    title: "Giảng viên",
    message: "Có giảng viên bị trùng trong file",
  },

  INSTRUCTOR_USER_NOT_FOUND: {
    type: "error",
    title: "Giảng viên",
    message: "User không tồn tại",
  },

  INSTRUCTOR_BULK_CREATE_FAILED: {
    type: "error",
    title: "Giảng viên",
    message: "Import giảng viên thất bại",
  },
  INSTRUCTOR_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Giảng viên",
    message: "Chưa chọn giảng viên để xóa",
  },
  INSTRUCTOR_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Giảng viên",
    message: "Đã tạo dữ liệu xem trước export",
  },

  INSTRUCTOR_EXPORT_SUCCESS: {
    type: "success",
    title: "Giảng viên",
    message: "Xuất giảng viên thành công",
  },

  INSTRUCTOR_EXPORT_EMPTY: {
    type: "warning",
    title: "Giảng viên",
    message: "Không có dữ liệu để export",
  },
  INSTRUCTOR_FILTER_OPTIONS_FAILED: {
    type: "error",
    title: "Giảng viên",
    message: "Không thể tải bộ lọc giảng viên",
  },
};

export const fetchInstructors = createAsyncThunk(
  "instructors/fetchAll",
  async (args = {}, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sort = "newest",
        expertise = "",
      } = args;

      const query = buildQueryString({
        page,
        limit,
        search,
        sort,
        expertise,
      });

      const res = await api.get(`/instructors?${query}`);

      return {
        instructors: res.data?.instructors || [],
        pagination: res.data?.pagination || {},
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const fetchPublicInstructors = createAsyncThunk(
  "instructors/publicList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { cursor = null, limit = 12, filters = {} } = args;

      const params = buildQueryString({
        cursor,
        limit,
        ...filters,
      });

      const res = await api.get(`/instructors/public?${params}`);

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
export const fetchInstructorFilterOptions = createAsyncThunk(
  "instructors/filterOptions",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get("/instructors/filter-options");

      return res.data?.data || {};
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_FILTER_OPTIONS_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const fetchInstructorOptions = createAsyncThunk(
  "instructors/options",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/instructors/options");

      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

/** ===========================================================
 * 📘 LẤY CHI TIẾT GIẢNG VIÊN THEO SLUG
 * =========================================================== */
export const fetchInstructorDetailBySlug = createAsyncThunk(
  "instructors/fetchDetailBySlug",
  async (slug, { dispatch, rejectWithValue }) => {
    if (!slug) return rejectWithValue("Slug không hợp lệ");
    try {
      const res = await api.get(`/instructors/${slug}`);
      return res.data?.instructor;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message:
            err.response?.data?.error || "Không thể lấy chi tiết giảng viên",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

/** ===========================================================
 * 🧩 TẠO GIẢNG VIÊN
 * =========================================================== */
export const createInstructor = createAsyncThunk(
  "instructors/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/instructors/create", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        instructor: data?.instructor,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/** ===========================================================
 * 🧩 TẠO NHIỀU GIẢNG VIÊN
 * =========================================================== */
export const createManyInstructors = createAsyncThunk(
  "instructors/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/instructors/bulk", payloadList);

      const { code, data, summary } = res.data;

      // ✅ toast theo code + summary giống course
      if (code === "INSTRUCTOR_BULK_CREATED") {
        const { created, skipped, failed } = summary;

        dispatch(
          addToast({
            type: failed > 0 ? "warning" : "success",
            title: "Import giảng viên",
            message: `Hoàn tất: ${created} tạo mới • ${skipped} bỏ qua • ${failed} lỗi`,
          })
        );
      } else {
        const toast = toastMap[code];
        if (toast) dispatch(addToast(toast));
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
      const code = res?.code || "INSTRUCTOR_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/** ===========================================================
 * ✏️ CẬP NHẬT GIẢNG VIÊN
 * =========================================================== */
export const updateInstructor = createAsyncThunk(
  "instructors/updateInstructor",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;

      const res = await api.put(`/instructors/${id}`, data);

      const { code, data: body } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        instructor: body.instructor,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_UPDATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/** ===========================================================
 * XÓA NHIỀU GIẢNG VIÊN
 * =========================================================== */
export const deleteManyInstructors = createAsyncThunk(
  "instructors/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/instructors/delete-many", { ids });

      const { code, data } = res.data;

      // ✅ toast theo code backend
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const previewExportInstructors = createAsyncThunk(
  "instructors/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportInstructorsApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const exportInstructors = createAsyncThunk(
  "instructors/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportInstructorsApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "instructors_export";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.INSTRUCTOR_EXPORT_SUCCESS;
      if (toast) dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
