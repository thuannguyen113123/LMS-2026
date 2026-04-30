import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { buildQueryString } from "../courses/coursesThunks";
import { addToast } from "../ui/uiSlice";

export const toastMap = {
  /* ================= CERTIFICATE ================= */

  CERTIFICATE_ISSUE_SUCCESS: {
    type: "success",
    title: "Chứng chỉ",
    message: "Cấp chứng chỉ thành công",
  },

  CERTIFICATE_ALREADY_EXISTS: {
    type: "warning",
    title: "Chứng chỉ",
    message: "Học viên đã có chứng chỉ khóa học này",
  },

  CERTIFICATE_STUDENT_NOT_FOUND: {
    type: "error",
    title: "Chứng chỉ",
    message: "Không tìm thấy học viên",
  },

  CERTIFICATE_ISSUE_FAILED: {
    type: "error",
    title: "Chứng chỉ",
    message: "Cấp chứng chỉ thất bại",
  },
  CERTIFICATE_REVOKE_SUCCESS: {
    type: "success",
    title: "Chứng chỉ",
    message: "Thu hồi chứng chỉ thành công",
  },

  CERTIFICATE_NOT_FOUND: {
    type: "error",
    title: "Chứng chỉ",
    message: "Không tìm thấy chứng chỉ",
  },

  CERTIFICATE_REVOKE_FAILED: {
    type: "error",
    title: "Chứng chỉ",
    message: "Thu hồi chứng chỉ thất bại",
  },
};

export const fetchCertificates = createAsyncThunk(
  "certificates/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search } = args;

      const params = buildQueryString({
        page,
        limit,
        ...filters,
        search,
      });

      const res = await api.get(`/students/me/certificates?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
export const fetchMyCertificates = createAsyncThunk(
  "certificates/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("students/public/certificates");
      return res.data.certificates;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const issueCertificate = createAsyncThunk(
  "certificates/issue",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/students/certificates/issue", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        certificate: data.certificate,
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
export const revokeCertificate = createAsyncThunk(
  "certificates/revoke",
  async (certificateId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.patch(
        `/students/certificates/${certificateId}/revoke`
      );

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        certificate: data.certificate,
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
