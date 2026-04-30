import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";
import { buildQueryString } from "../courses/coursesThunks";
import {
  exportLessonsApi,
  previewExportLessonsApi,
} from "../../app/lesson.api";

export const toastMap = {
  LESSON_CREATED: {
    type: "success",
    title: "Bài học",
    message: "Tạo bài học thành công",
  },

  LESSON_EXISTS: {
    type: "error",
    title: "Bài học",
    message: "Bài học đã tồn tại",
  },

  LESSON_CREATE_FAILED: {
    type: "error",
    title: "Bài học",
    message: "Tạo bài học thất bại",
  },

  LESSON_COURSE_NOT_FOUND: {
    type: "error",
    title: "Bài học",
    message: "Không tìm thấy khóa học",
  },

  LESSON_INSTRUCTOR_NOT_ALLOWED: {
    type: "error",
    title: "Bài học",
    message: "Bạn không có quyền tạo bài học cho khóa này",
  },
  LESSON_BULK_CREATE_FAILED: {
    type: "error",
    title: "Bài học",
    message: "Import bài học thất bại",
  },

  LESSON_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Bài học",
    message: "Danh sách lesson không hợp lệ",
  },
  // ===== LESSON =====
  LESSON_UPDATED: {
    type: "success",
    title: "Bài học",
    message: "Cập nhật bài học thành công",
  },

  LESSON_UPDATE_FAILED: {
    type: "error",
    title: "Bài học",
    message: "Cập nhật bài học thất bại",
  },

  LESSON_NOT_FOUND: {
    type: "error",
    title: "Bài học",
    message: "Không tìm thấy bài học",
  },

  LESSON_FORBIDDEN: {
    type: "error",
    title: "Bài học",
    message: "Không có quyền cập nhật bài học này",
  },
  LESSON_DELETE_SUCCESS: {
    type: "success",
    title: "Bài học",
    message: "Xóa bài học thành công",
  },

  LESSON_DELETE_FAILED: {
    type: "error",
    title: "Bài học",
    message: "Xóa bài học thất bại",
  },

  LESSON_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Bài học",
    message: "Chưa chọn bài học để xóa",
  },
  LESSON_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Bài học",
    message: "Đã tạo dữ liệu xem trước export",
  },

  LESSON_EXPORT_SUCCESS: {
    type: "success",
    title: "Bài học",
    message: "Xuất bài học thành công",
  },

  LESSON_EXPORT_EMPTY: {
    type: "warning",
    title: "Bài học",
    message: "Không có dữ liệu để export",
  },

  LESSON_EXPORT_FAILED: {
    type: "error",
    title: "Bài học",
    message: "Xuất bài học thất bại",
  },
};

export const fetchLessons = createAsyncThunk(
  "lessons/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const {
        slug = null,
        page = 1,
        limit = 10,
        filters = {},
        search = "",
      } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const url = slug
        ? `/courses/${slug}/lessons?${params}`
        : `/lessons?${params}`;

      const res = await api.get(url);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "LESSON_LIST_FAILED",
      });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);

export const fetchPublicLessons = createAsyncThunk(
  "lessons/publicList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { slug = null, cursor = null, limit = 10 } = args;

      const params = buildQueryString({
        slug,
        cursor,
        limit,
      });

      const url = `/lessons/public?${params}`;

      const res = await api.get(url);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "LESSON_PUBLIC_LIST_FAILED",
      });
    }
  }
);

export const fetchMyLessons = createAsyncThunk(
  "lessons/fetchMyLessons",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get("/lessons/my-lessons");
      return res.data.lessons || [];
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message:
            err.response?.data?.message || "Không lấy được bài học của bạn",
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// -----------------------------------
// Get lesson detail BY SLUG
// -----------------------------------
export const fetchLessonDetailBySlug = createAsyncThunk(
  "lessons/fetchDetailBySlug",
  async (slug, { dispatch, rejectWithValue }) => {
    if (!slug) return rejectWithValue("Slug không hợp lệ");
    try {
      const res = await api.get(`/lessons/detail/${slug}`);
      return res.data.data;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.response?.data?.error || "Không lấy được bài học",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const createLesson = createAsyncThunk(
  "lessons/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/lessons/createLesson", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        lesson: data.lesson,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "LESSON_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const createManyLessons = createAsyncThunk(
  "lessons/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/lessons/bulk", payloadList);

      const { code, data, summary } = res.data;

      // ✅ giống course bulk toast summary
      if (code === "LESSON_BULK_CREATED") {
        const { created, skipped, failed } = summary;

        dispatch(
          addToast({
            type: failed > 0 ? "warning" : "success",
            title: "Import bài học",
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
      const code = res?.code || "LESSON_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// -----------------------------------
// UPDATE LESSON
// -----------------------------------
export const updateLesson = createAsyncThunk(
  "lessons/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;

      // instructor route giống course style
      const res = await api.put(`/lessons/${id}`, data);

      const { code, data: resData } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        lesson: resData.lesson,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "LESSON_UPDATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const deleteManyLessons = createAsyncThunk(
  "lessons/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/lessons/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "LESSON_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const previewExportLessons = createAsyncThunk(
  "lessons/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportLessonsApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "LESSON_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const exportLessons = createAsyncThunk(
  "lessons/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportLessonsApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "lessons_export";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.LESSON_EXPORT_SUCCESS;
      if (toast) dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "LESSON_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
