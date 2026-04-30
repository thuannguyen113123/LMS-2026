import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import {
  exportStudentsApi,
  previewExportStudentsApi,
} from "../../app/student.api";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  // ===== STUDENT =====
  STUDENT_CREATED: {
    type: "success",
    title: "Học sinh",
    message: "Tạo học sinh thành công",
  },

  STUDENT_EXISTS: {
    type: "error",
    title: "Học sinh",
    message: "Học sinh đã tồn tại",
  },

  STUDENT_USER_NOT_FOUND: {
    type: "error",
    title: "Học sinh",
    message: "Không tìm thấy user",
  },

  STUDENT_CREATE_FAILED: {
    type: "error",
    title: "Học sinh",
    message: "Tạo học sinh thất bại",
  },
  STUDENT_BULK_CREATED: {
    type: "success",
    title: "Học sinh",
    message: "Import học sinh thành công",
  },

  STUDENT_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Học sinh",
    message: "Danh sách học sinh không hợp lệ",
  },

  STUDENT_BULK_VALIDATION_FAILED: {
    type: "warning",
    title: "Học sinh",
    message: "Có dòng dữ liệu học sinh không hợp lệ",
  },

  STUDENT_ALREADY_EXISTS: {
    type: "warning",
    title: "Học sinh",
    message: "Một số học sinh đã tồn tại",
  },

  STUDENT_BULK_CREATE_FAILED: {
    type: "error",
    title: "Học sinh",
    message: "Import học sinh thất bại",
  },
  // ===== STUDENT DELETE =====
  STUDENT_DELETE_SUCCESS: {
    type: "success",
    title: "Học sinh",
    message: "Xóa học sinh thành công",
  },

  STUDENT_DELETE_FAILED: {
    type: "error",
    title: "Học sinh",
    message: "Xóa học sinh thất bại",
  },

  STUDENT_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Học sinh",
    message: "Chưa chọn học sinh để xóa",
  },

  STUDENT_NOT_FOUND: {
    type: "error",
    title: "Học sinh",
    message: "Không tìm thấy học sinh",
  },
  // ===== STUDENT EXPORT =====
  STUDENT_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Học sinh",
    message: "Đã tạo dữ liệu xem trước export",
  },

  STUDENT_EXPORT_SUCCESS: {
    type: "success",
    title: "Học sinh",
    message: "Xuất học sinh thành công",
  },

  STUDENT_EXPORT_EMPTY: {
    type: "warning",
    title: "Học sinh",
    message: "Không có dữ liệu để export",
  },

  STUDENT_EXPORT_SCOPE_INVALID: {
    type: "error",
    title: "Học sinh",
    message: "Phạm vi export không hợp lệ",
  },

  STUDENT_EXPORT_SELECTED_EMPTY: {
    type: "warning",
    title: "Học sinh",
    message: "Chưa chọn học sinh để export",
  },

  STUDENT_EXPORT_FORMAT_INVALID: {
    type: "error",
    title: "Học sinh",
    message: "Định dạng export không hợp lệ",
  },

  STUDENT_EXPORT_FAILED: {
    type: "error",
    title: "Học sinh",
    message: "Export học sinh thất bại",
  },
  BOOKMARK_ADDED: {
    type: "success",
    message: "Đã lưu khóa học",
  },

  BOOKMARK_REMOVED: {
    type: "info",
    message: "Đã bỏ lưu khóa học",
  },
  // ===== INSTRUCTOR RATING =====
  INSTRUCTOR_RATING_SUCCESS: {
    type: "success",
    title: "Đánh giá",
    message: "Đánh giá giảng viên thành công",
  },

  INSTRUCTOR_RATING_UPDATED: {
    type: "success",
    title: "Đánh giá",
    message: "Đã cập nhật đánh giá",
  },

  INSTRUCTOR_RATING_REMOVED: {
    type: "info",
    title: "Đánh giá",
    message: "Đã xoá đánh giá giảng viên",
  },

  INSTRUCTOR_RATING_INVALID: {
    type: "warning",
    title: "Đánh giá",
    message: "Rating phải từ 1 đến 5",
  },
};

/** ===========================================================
 * 🔍 LẤY DANH SÁCH HỌC SINH
 * =========================================================== */
export const fetchStudents = createAsyncThunk(
  "students/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/students?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
export const fetchPublicStudents = createAsyncThunk(
  "students/publicList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { cursor = null, limit = 12, filters = {} } = args;

      const params = buildQueryString({
        cursor,
        limit,
        ...filters,
      });

      const res = await api.get(`/students/public?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchBookmarks = createAsyncThunk(
  "students/fetchBookmarks",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { cursor = null, limit = 12 } = args;

      const params = buildQueryString({
        cursor,
        limit,
      });

      const res = await api.get(`/students/me/bookmarks?${params}`);

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
export const toggleBookmark = createAsyncThunk(
  "students/toggleBookmark",
  async (courseId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/students/me/bookmarks/${courseId}/toggle`);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        courseId,
        bookmarks: data.bookmarks,
        code,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchStudentDetail = createAsyncThunk(
  "students/fetchDetail",
  async (id, { dispatch, rejectWithValue }) => {
    if (!id) return rejectWithValue("ID không hợp lệ");
    try {
      const res = await api.get(`/students/${id}`);
      return res.data?.student;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message:
            err.response?.data?.error || "Không thể lấy chi tiết học sinh",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

/** ===========================================================
 * 🧩 TẠO HỌC SINH
 * =========================================================== */
export const createStudent = createAsyncThunk(
  "students/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/students/create", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        student: data.student,
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

/** ===========================================================
 * 🧩 TẠO NHIỀU HỌC SINH
 * =========================================================== */
export const createManyStudents = createAsyncThunk(
  "students/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/students/bulk", payloadList);

      const { code, data, summary } = res.data;

      if (code === "STUDENT_BULK_CREATED") {
        const { created, skipped, failed } = summary;

        dispatch(
          addToast({
            type: failed > 0 ? "warning" : "success",
            title: "Import học sinh",
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
      const code = res?.code || "STUDENT_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/** ===========================================================
 * ✏️ CẬP NHẬT HỌC SINH
 * =========================================================== */
export const updateStudent = createAsyncThunk(
  "students/updateStudent",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      const res = await api.put(`/students/${id}`, data);
      dispatch(
        addToast({ type: "success", message: "Cập nhật học sinh thành công" })
      );
      return res.data.student;
    } catch (err) {
      dispatch(addToast({ type: "error", message: "Cập nhật thất bại" }));
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const fetchStudentStats = createAsyncThunk(
  "students/fetchStats",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/students/${id}/stats`);
      return res.data.stats;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const deleteManyStudents = createAsyncThunk(
  "students/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/students/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "STUDENT_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const previewExportStudents = createAsyncThunk(
  "students/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportStudentsApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "STUDENT_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const exportStudents = createAsyncThunk(
  "students/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportStudentsApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "students_export";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.STUDENT_EXPORT_SUCCESS || {
        type: "success",
        message: "Xuất học sinh thành công",
      };

      dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "STUDENT_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const rateInstructor = createAsyncThunk(
  "students/rateInstructor",
  async ({ instructorId, rating }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/students/me/instructor-rating`, {
        instructorId,
        rating,
      });

      const { code } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        instructorId,
        rating,
        code,
      };
    } catch (err) {
      const code = err.response?.data?.code;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const removeInstructorRating = createAsyncThunk(
  "students/removeInstructorRating",
  async ({ instructorId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.delete(
        `/students/me/instructor-rating/${instructorId}`
      );

      const { code } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        instructorId,
        code,
      };
    } catch (err) {
      const code = err.response?.data?.code;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
