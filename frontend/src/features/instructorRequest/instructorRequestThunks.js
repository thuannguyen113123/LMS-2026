import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";

export const instructorRequestToastMap = {
  INSTRUCTOR_REQUEST_CREATED: {
    type: "success",
    title: "Giảng viên",
    message: "Đã gửi yêu cầu trở thành giảng viên",
  },

  INSTRUCTOR_REQUEST_FAILED: {
    type: "error",
    title: "Giảng viên",
    message: "Gửi yêu cầu thất bại",
  },

  INSTRUCTOR_REQUEST_APPROVED: {
    type: "success",
    title: "Giảng viên",
    message: "Đã duyệt yêu cầu",
  },

  INSTRUCTOR_REQUEST_APPROVE_FAILED: {
    type: "error",
    title: "Giảng viên",
    message: "Duyệt yêu cầu thất bại",
  },

  INSTRUCTOR_REQUEST_REJECTED: {
    type: "warning",
    title: "Giảng viên",
    message: "Đã từ chối yêu cầu",
  },

  INSTRUCTOR_REQUEST_REJECT_FAILED: {
    type: "error",
    title: "Giảng viên",
    message: "Từ chối yêu cầu thất bại",
  },

  REQUEST_EXISTS: {
    type: "warning",
    title: "Giảng viên",
    message: "Bạn đã gửi yêu cầu rồi",
  },

  ALREADY_INSTRUCTOR: {
    type: "info",
    title: "Giảng viên",
    message: "Bạn đã là giảng viên",
  },
};
export const requestUpgradeInstructor = createAsyncThunk(
  "instructorRequest/requestUpgrade",
  async ({ message }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/instructor-requests", {
        message,
        meta: {
          source: "web",
        },
      });

      const { code, data } = res.data;

      const toast = instructorRequestToastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, request: data };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_REQUEST_FAILED";

      const toast = instructorRequestToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const approveInstructorRequest = createAsyncThunk(
  "instructorRequest/approve",
  async (requestId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/instructor-requests/${requestId}/approve`);

      const { code, data } = res.data;

      const toast = instructorRequestToastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        instructor: data,
        requestId,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_REQUEST_APPROVE_FAILED";

      const toast = instructorRequestToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const rejectInstructorRequest = createAsyncThunk(
  "instructorRequest/reject",
  async ({ id, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/instructor-requests/${id}/reject`, {
        reason,
      });

      const { code } = res.data;

      const toast = instructorRequestToastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        requestId: id,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "INSTRUCTOR_REQUEST_REJECT_FAILED";

      const toast = instructorRequestToastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
