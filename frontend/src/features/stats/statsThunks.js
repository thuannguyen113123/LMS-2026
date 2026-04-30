import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";

export const toastMap = {
  HERO_STATS_FETCHED: {
    type: "success",
    message: "Đã tải thống kê hệ thống",
  },

  HERO_STATS_FAILED: {
    type: "error",
    message: "Không thể tải thống kê",
  },
  HIGHLIGHT_STATS_FETCHED: {
    type: "success",
    message: "Đã tải highlight",
  },

  HIGHLIGHT_STATS_FAILED: {
    type: "error",
    message: "Không thể tải highlight",
  },
};

export const fetchHeroStats = createAsyncThunk(
  "stats/fetchHero",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get("/stats/hero");

      const { code, data } = res.data;

      // ✅ Chỉ toast khi lỗi
      if (code !== "HERO_STATS_FETCHED") {
        const toast = toastMap[code];
        if (toast) dispatch(addToast(toast));
      }

      return {
        code,
        stats: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "HERO_STATS_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);
export const fetchHighlightStats = createAsyncThunk(
  "stats/fetchHighlight",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get("/stats/highlights");

      const { code, data } = res.data;

      // toast only when unexpected
      if (code !== "HIGHLIGHT_STATS_FETCHED") {
        const toast = toastMap[code];
        if (toast) dispatch(addToast(toast));
      }

      return {
        code,
        stats: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "HIGHLIGHT_STATS_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);
export const fetchAboutStats = createAsyncThunk(
  "stats/fetchAbout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/stats/about");

      const { code, data } = res.data;

      return {
        code,
        stats: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "ABOUT_STATS_FAILED";

      return rejectWithValue({ code });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);
