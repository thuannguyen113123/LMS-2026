import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import { exportQuizzesApi, previewExportQuizzesApi } from "../../app/quiz.api";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  // ===== QUIZ =====
  QUIZ_CREATED: {
    type: "success",
    title: "Quiz",
    message: "Tạo quiz thành công",
  },

  QUIZ_EXISTS: {
    type: "error",
    title: "Quiz",
    message: "Quiz đã tồn tại",
  },

  QUIZ_CREATE_FAILED: {
    type: "error",
    title: "Quiz",
    message: "Tạo quiz thất bại",
  },
  QUIZ_BULK_CREATED: {
    type: "success",
    title: "Quiz",
    message: "Import quiz thành công",
  },

  QUIZ_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Quiz",
    message: "Danh sách quiz không hợp lệ",
  },

  QUIZ_BULK_VALIDATION_FAILED: {
    type: "warning",
    title: "Quiz",
    message: "Có dòng quiz không hợp lệ",
  },

  QUIZ_BULK_DUPLICATE_IN_FILE: {
    type: "warning",
    title: "Quiz",
    message: "Có quiz bị trùng trong file",
  },

  QUIZ_ALREADY_EXISTS: {
    type: "warning",
    title: "Quiz",
    message: "Một số quiz đã tồn tại",
  },

  QUIZ_BULK_CREATE_FAILED: {
    type: "error",
    title: "Quiz",
    message: "Import quiz thất bại",
  },
  QUIZ_UPDATED: {
    type: "success",
    title: "Quiz",
    message: "Cập nhật quiz thành công",
  },

  QUIZ_UPDATE_FAILED: {
    type: "error",
    title: "Quiz",
    message: "Cập nhật quiz thất bại",
  },

  QUIZ_NOT_FOUND: {
    type: "error",
    title: "Quiz",
    message: "Không tìm thấy quiz",
  },
};

export const fetchQuizzes = createAsyncThunk(
  "quizzes/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/quizzes?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
export const fetchPublicQuizzes = createAsyncThunk(
  "quizzes/publicList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { cursor = null, limit = 12, filters = {} } = args;

      const params = buildQueryString({
        cursor,
        limit,
        ...filters,
      });

      const res = await api.get(`/quizzes/public?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

// 🧠 STUDENT - MY QUIZZES
export const fetchMyQuizzes = createAsyncThunk(
  "quizzes/myList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { cursor = null, limit = 8, filters = {}, search = "" } = args;

      const params = buildQueryString({
        cursor,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/quizzes/my?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

// 🧭 Lấy chi tiết quiz
export const fetchQuizDetail = createAsyncThunk(
  "quizzes/fetchDetail",
  async (id, { dispatch, rejectWithValue }) => {
    if (!id) return rejectWithValue("ID quiz không hợp lệ");
    try {
      const res = await api.get(`/quizzes/${id}`);
      return res.data?.quiz;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.response?.data?.error || "Lấy chi tiết quiz thất bại",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);
export const fetchQuizOptions = createAsyncThunk(
  "quizzes/fetchOptions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/quizzes/options");

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "QUIZ_OPTIONS_FAILED",
      });
    }
  }
);

// 🧩 Tạo quiz mới
export const createQuiz = createAsyncThunk(
  "quizzes/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/quizzes/createQuizz", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        quiz: data.quiz,
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

// 🧩 Tạo nhiều quiz cùng lúc
export const createManyQuizzes = createAsyncThunk(
  "quizzes/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/quizzes/bulk", payloadList);

      const { code, data, summary } = res.data;

      if (code === "QUIZ_BULK_CREATED") {
        const { created, skipped, failed } = summary;

        dispatch(
          addToast({
            type: failed > 0 ? "warning" : "success",
            title: "Import quiz",
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
      const code = res?.code || "QUIZ_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 🔄 Cập nhật quiz
export const updateQuiz = createAsyncThunk(
  "quizzes/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;

      const res = await api.put(`/quizzes/${id}`, data);

      const { code, data: resData } = res.data;

      // toast theo code backend
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        quiz: resData.quiz,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "QUIZ_UPDATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 🗑️ Xóa nhiều quiz
export const deleteManyQuizzes = createAsyncThunk(
  "quizzes/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/quizzes/delete-many", {
        data: { ids },
      });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "QUIZ_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
// ===== PREVIEW EXPORT QUIZZES =====
export const previewExportQuizzes = createAsyncThunk(
  "quizzes/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportQuizzesApi(payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;

      const code = res?.code || "QUIZ_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ===== EXPORT QUIZZES =====
export const exportQuizzes = createAsyncThunk(
  "quizzes/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportQuizzesApi(payload);

      const contentType = res.headers["content-type"];

      const disposition = res.headers["content-disposition"];

      let fileName = "quizzes_export";

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);

        if (match) fileName = match[1];
      }

      const toast = toastMap.QUIZ_EXPORT_SUCCESS || {
        type: "success",
        message: "Xuất quiz thành công",
      };

      dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;

      const code = res?.code || "QUIZ_EXPORT_FAILED";

      const toast = toastMap[code];

      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
