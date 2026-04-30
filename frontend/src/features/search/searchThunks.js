import { createAsyncThunk } from "@reduxjs/toolkit";

import api from "../../app/api";
import { addToast } from "../ui/uiSlice";

export const toastMap = {
  SEARCH_SUCCESS: {
    type: "info",
    title: "Tìm kiếm",
    message: "Đã hiển thị kết quả tìm kiếm",
  },

  SEARCH_FAILED: {
    type: "error",
    title: "Tìm kiếm",
    message: "Tìm kiếm thất bại",
  },
};

export const searchCourses = createAsyncThunk(
  "search/searchCourses",
  async ({ q = "", page = 1, limit = 10 }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.get("/search/courses", {
        params: { q, page, limit },
      });

      const { code, data } = res.data;

      if (code !== "SEARCH_SUCCESS") {
        const toast = toastMap[code];
        if (toast) dispatch(addToast(toast));
      }

      return {
        code,
        courses: data.courses,
        pagination: data.pagination,
        query: q,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SEARCH_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
