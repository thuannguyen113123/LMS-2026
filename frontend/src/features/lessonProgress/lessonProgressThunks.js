import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  LESSON_PROGRESS_FETCHED: {
    type: "info",
    title: "Bài học",
    message: "Đã khởi tạo tiến độ bài học",
  },

  LESSON_PROGRESS_FAILED: {
    type: "error",
    title: "Bài học",
    message: "Không thể khởi tạo tiến độ bài học",
  },
  LESSON_PROGRESS_UPDATED: {
    type: "info",
    title: "Bài học",
    message: "Đã cập nhật tiến độ bài học",
  },

  LESSON_PROGRESS_NOT_FOUND: {
    type: "error",
    title: "Bài học",
    message: "Không tìm thấy tiến độ bài học",
  },
  LESSON_PROGRESS_RESET_SUCCESS: {
    type: "success",
    title: "Tiến độ",
    message: "Đã reset tiến độ bài học",
  },

  LESSON_PROGRESS_RESET_FAILED: {
    type: "error",
    title: "Tiến độ",
    message: "Không thể reset tiến độ",
  },
};

export const fetchLessonProgressList = createAsyncThunk(
  "lessonProgress/list",

  async (args = {}, { dispatch, rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, sort = "latest" } = args;

      const params = buildQueryString({
        page,
        limit,
        sort,
        ...filters,
      });

      const res = await api.get(`/lesson-progress?${params}`);

      const { code, data, pagination } = res.data;

      return {
        code,
        progresses: data,
        pagination,
      };
    } catch (err) {
      const code = err.response?.data?.code;

      dispatch(
        addToast({
          type: "error",
          message: "Không thể tải tiến độ học tập",
        })
      );

      return rejectWithValue({ code });
    }
  }
);
export const fetchLessonProgressDetail = createAsyncThunk(
  "lessonProgress/detail",

  async (progressId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/lesson-progress/${progressId}`);

      const { code, data } = res.data;

      return {
        code,
        detail: data,
      };
    } catch (err) {
      const code = err.response?.data?.code;

      return rejectWithValue({ code });
    }
  }
);

export const resetLessonProgressById = createAsyncThunk(
  "lessonProgress/reset",

  async (progressId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/lesson-progress/${progressId}/reset`);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        progress: data.progress,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const getOrCreateLessonProgress = createAsyncThunk(
  "lessonProgress/getOrCreate",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/lesson-progress/get-or-create", payload);

      const { code, data } = res.data;

      if (code !== "LESSON_PROGRESS_FETCHED") {
        const toast = toastMap[code];
        if (toast) dispatch(addToast(toast));
      }

      return {
        code,
        progress: data.progress,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);

export const fetchLessonProgressByCourse = createAsyncThunk(
  "lessonProgress/fetchByCourse",
  async (courseId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get(`/lesson-progress/course/${courseId}`);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        progresses: data.progresses,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);

export const updateLessonWatching = createAsyncThunk(
  "lessonProgress/updateWatching",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.patch("/lesson-progress/watching", payload);

      const { code, data } = res.data;

      if (code !== "LESSON_PROGRESS_UPDATED") {
        const toast = toastMap[code];
        if (toast) dispatch(addToast(toast));
      }

      return {
        code,
        progress: data.progress,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

/* =====================================================
   COMPLETE LESSON
===================================================== */
export const completeLesson = createAsyncThunk(
  "lessonProgress/completeLesson",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.patch("/lesson-progress/complete", payload);

      dispatch(
        addToast({
          type: "success",
          message: "Hoàn thành bài học 🎉",
        })
      );

      return res.data.progress;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: "Không thể hoàn thành bài học",
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* =====================================================
   SUBMIT QUIZ
===================================================== */
export const submitLessonQuiz = createAsyncThunk(
  "lessonProgress/submitQuiz",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/lesson-progress/quiz", payload);

      dispatch(
        addToast({
          type: "success",
          message:
            res.data.progress?.status === "completed"
              ? "Bạn đã vượt qua bài quiz 🎯"
              : "Bạn chưa vượt qua quiz 😢",
        })
      );

      return res.data.progress;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: "Nộp bài quiz thất bại",
        })
      );
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
