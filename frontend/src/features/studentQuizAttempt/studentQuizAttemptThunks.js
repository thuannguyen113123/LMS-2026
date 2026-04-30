import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  // ===== QUIZ ATTEMPT =====
  QUIZ_ATTEMPT_STARTED: {
    type: "success",
    title: "Quiz",
    message: "Bắt đầu quiz thành công",
  },

  QUIZ_ATTEMPT_IN_PROGRESS_EXISTS: {
    type: "error",
    title: "Quiz",
    message: "Bạn đang có quiz chưa hoàn thành",
  },

  QUIZ_ATTEMPT_LESSON_LOCKED: {
    type: "error",
    title: "Quiz",
    message: "Bài học đang bị khóa",
  },

  QUIZ_ATTEMPT_OUT_OF_ATTEMPTS: {
    type: "error",
    title: "Quiz",
    message: "Bạn đã hết lượt làm quiz",
  },

  QUIZ_ATTEMPT_START_FAILED: {
    type: "error",
    title: "Quiz",
    message: "Không thể bắt đầu quiz",
  },
};

// Giống 100% fetchCourses
export const fetchStudentQuizAttempts = createAsyncThunk(
  "studentQuizAttempt/list",

  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/student-quiz-attempts?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchStudentQuizAttemptDetailById = createAsyncThunk(
  "studentQuizAttempt/fetchDetail",
  async (id, { dispatch, rejectWithValue }) => {
    if (!id) return rejectWithValue("ID không hợp lệ");
    try {
      const res = await api.get(`/student-quiz-attempts/${id}`);
      return res.data?.attempt;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message:
            err.response?.data?.error || "Không thể lấy chi tiết bài làm quiz",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);

export const startStudentQuizAttempt = createAsyncThunk(
  "studentQuizAttempt/start",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/student-quiz-attempts", payload);

      const code = res.data?.code;
      const payloadData = res.data?.data || {};

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        attempt: payloadData.attempt || null,
        canReview: payloadData.canReview === true,
        attemptId: payloadData.attemptId || null,
      };
    } catch (err) {
      const res = err.response?.data;

      dispatch(
        addToast({
          type: "error",
          title: "Quiz",
          message: res?.message || "Có lỗi xảy ra",
        })
      );

      return rejectWithValue({
        code: res?.code,
      });
    }
  }
);
export const fetchAttemptAnswers = createAsyncThunk(
  "studentQuizAttempt/fetchAnswers",
  async ({ attemptId, cursor = null, limit = 10 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      if (cursor) params.append("cursor", cursor);
      if (limit) params.append("limit", limit);

      const res = await api.get(
        `/student-quiz-attempts/${attemptId}/answers?${params.toString()}`
      );

      return {
        attemptId,
        answers: res.data.answers,
        pagination: res.data.pagination,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const submitStudentQuizAttempt = createAsyncThunk(
  "studentQuizAttempt/submit",
  async ({ attemptId, answers }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/student-quiz-attempts/${attemptId}/submit`, {
        answers,
      });
      dispatch(addToast({ type: "success", message: "Nộp quiz thành công" }));
      return res.data?.attempt;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.response?.data?.error || "Nộp quiz thất bại",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const deleteStudentQuizAttempt = createAsyncThunk(
  "studentQuizAttempt/delete",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/student-quiz-attempts/${id}`);
      dispatch(addToast({ type: "success", message: "Đã xóa bài làm quiz" }));
      return id;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.response?.data?.error || "Xóa bài làm quiz thất bại",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);
