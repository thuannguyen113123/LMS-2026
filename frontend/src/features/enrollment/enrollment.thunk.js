import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";

// Ghi danh khóa học miễn phí
export const enrollFreeCourse = createAsyncThunk(
  "enrollment/enrollFreeCourse",
  async (courseId, { dispatch, rejectWithValue }) => {
    if (!courseId) return rejectWithValue("Course ID không hợp lệ");

    try {
      const res = await api.post(`/courses/${courseId}/enroll-free`);

      dispatch(
        addToast({
          type: "success",
          message: "Đăng ký khóa học thành công",
        })
      );

      return {
        courseId,
        enrolled: res.data?.enrolled ?? true,
      };
    } catch (err) {
      const message = err.response?.data?.error || "Đăng ký khóa học thất bại";

      dispatch(
        addToast({
          type: "error",
          message,
        })
      );

      return rejectWithValue(message);
    }
  }
);
