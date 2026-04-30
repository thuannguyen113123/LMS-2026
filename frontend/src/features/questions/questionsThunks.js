import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import {
  exportQuestionsApi,
  previewExportQuestionsApi,
} from "../../app/question.api";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  // ===== QUESTION BULK =====
  QUESTION_BULK_CREATED: {
    type: "success",
    title: "Câu hỏi",
    message: "Import câu hỏi thành công",
  },

  QUESTION_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Câu hỏi",
    message: "Danh sách câu hỏi không hợp lệ",
  },

  QUESTION_BULK_VALIDATION_FAILED: {
    type: "warning",
    title: "Câu hỏi",
    message: "Có dòng câu hỏi không hợp lệ",
  },

  QUESTION_DUPLICATE_IN_FILE: {
    type: "warning",
    title: "Câu hỏi",
    message: "Có câu hỏi bị trùng trong file",
  },

  QUESTION_EXISTS: {
    type: "warning",
    title: "Câu hỏi",
    message: "Một số câu hỏi đã tồn tại",
  },

  QUESTION_QUIZ_NOT_FOUND: {
    type: "error",
    title: "Câu hỏi",
    message: "Quiz không tồn tại",
  },

  QUESTION_BULK_CREATE_FAILED: {
    type: "error",
    title: "Câu hỏi",
    message: "Import câu hỏi thất bại",
  },
  // ===== QUESTION =====
  QUESTION_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Câu hỏi",
    message: "Đã tạo dữ liệu xem trước export",
  },

  QUESTION_EXPORT_SUCCESS: {
    type: "success",
    title: "Câu hỏi",
    message: "Xuất câu hỏi thành công",
  },

  QUESTION_EXPORT_EMPTY: {
    type: "warning",
    title: "Câu hỏi",
    message: "Không có dữ liệu để export",
  },
  // ===== QUESTION =====
  QUESTION_UPDATED: {
    type: "success",
    title: "Câu hỏi",
    message: "Cập nhật câu hỏi thành công",
  },

  QUESTION_UPDATE_FAILED: {
    type: "error",
    title: "Câu hỏi",
    message: "Cập nhật câu hỏi thất bại",
  },
  QUESTION_MANY_DELETED: {
    type: "success",
    title: "Câu hỏi",
    message: "Đã xóa các câu hỏi thành công",
  },

  QUESTION_MANY_DELETE_FAILED: {
    type: "error",
    title: "Câu hỏi",
    message: "Xóa nhiều câu hỏi thất bại",
  },
};

// 📦 Lấy danh sách câu hỏi
export const fetchQuestions = createAsyncThunk(
  "questions/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/questions?${params}`);

      return res.data; // 👈 unwrap
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
export const fetchPublicQuestions = createAsyncThunk(
  "questions/publicList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { slug = null, cursor = null, limit = 10, filters = {} } = args;

      const params = buildQueryString({
        cursor,
        limit,
        ...filters,
      });

      const url = slug
        ? `/quiz/${slug}/questions/public?${params}`
        : `/questions/public?${params}`;

      const res = await api.get(url);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchQuestionsByQuiz = createAsyncThunk(
  "questions/fetchByQuiz",
  async (quizId, { rejectWithValue }) => {
    try {
      if (!quizId) {
        return rejectWithValue("QuizId không hợp lệ");
      }

      const res = await api.get(`/questions/by-quiz/${quizId}`);

      return {
        data: res.data?.questions || [],
        total: res.data?.total || 0,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);

// 📘 Lấy chi tiết câu hỏi
export const fetchQuestionDetail = createAsyncThunk(
  "questions/fetchDetail",
  async (id, { dispatch, rejectWithValue }) => {
    if (!id) return rejectWithValue("ID câu hỏi không hợp lệ");
    try {
      const res = await api.get(`/questions/${id}`);
      return res.data?.question;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.response?.data?.error || "Lấy chi tiết câu hỏi thất bại",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// 🆕 Tạo câu hỏi mới
export const createQuestion = createAsyncThunk(
  "questions/createQuestion",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/questions", payload);
      dispatch(
        addToast({ type: "success", message: "Tạo câu hỏi thành công" })
      );
      return res.data.data.question;
    } catch (err) {
      dispatch(addToast({ type: "error", message: "Tạo câu hỏi thất bại" }));
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🧩 Tạo nhiều câu hỏi cùng lúc
export const createManyQuestions = createAsyncThunk(
  "questions/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/questions/bulk", payloadList);

      const { code, data, summary } = res.data;

      if (code === "QUESTION_BULK_CREATED") {
        const { created, skipped, failed } = summary;

        dispatch(
          addToast({
            type: failed > 0 ? "warning" : "success",
            title: "Import câu hỏi",
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
      const code = res?.code || "QUESTION_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 🔁 Cập nhật câu hỏi
export const updateQuestion = createAsyncThunk(
  "questions/updateQuestion",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;

      const res = await api.put(`/questions/${id}`, data);

      const { code, data: question } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return question;
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "QUESTION_UPDATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 🗑️ Xóa nhiều câu hỏi
export const deleteManyQuestions = createAsyncThunk(
  "questions/deleteManyQuestions",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/questions/delete-many`, {
        data: { ids },
      });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return data.deletedIds;
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "QUESTION_MANY_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ===== PREVIEW EXPORT QUESTIONS =====
export const previewExportQuestions = createAsyncThunk(
  "questions/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportQuestionsApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "QUESTION_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ===== EXPORT QUESTIONS =====
export const exportQuestions = createAsyncThunk(
  "questions/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportQuestionsApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "questions_export";

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.QUESTION_EXPORT_SUCCESS || {
        type: "success",
        message: "Xuất câu hỏi thành công",
      };

      dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "QUESTION_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
