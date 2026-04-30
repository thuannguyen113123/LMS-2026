import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";
import {
  exportPaymentsApi,
  previewExportPaymentsApi,
} from "../../app/paymentApi";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  PAYMENT_DELETE_SUCCESS: {
    type: "success",
    title: "Thanh toán",
    message: "Xóa thanh toán thành công",
  },

  PAYMENT_DELETE_FAILED: {
    type: "error",
    title: "Thanh toán",
    message: "Xóa thanh toán thất bại",
  },

  PAYMENT_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Thanh toán",
    message: "Chưa chọn thanh toán để xóa",
  },

  PAYMENT_NOT_FOUND: {
    type: "error",
    title: "Thanh toán",
    message: "Không tìm thấy thanh toán",
  },
  PAYMENT_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Thanh toán",
    message: "Đã tạo dữ liệu xem trước export",
  },

  PAYMENT_EXPORT_SUCCESS: {
    type: "success",
    title: "Thanh toán",
    message: "Xuất thanh toán thành công",
  },

  PAYMENT_EXPORT_EMPTY: {
    type: "warning",
    title: "Thanh toán",
    message: "Không có dữ liệu để export",
  },

  PAYMENT_EXPORT_FAILED: {
    type: "error",
    title: "Thanh toán",
    message: "Xuất thanh toán thất bại",
  },
};

/**
 * 🧾 Lấy danh sách thanh toán (admin)
 */
export const fetchPayments = createAsyncThunk(
  "payments/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/payments?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const createTransaction = createAsyncThunk(
  "payments/createTransaction",
  async ({ nonce, orderId }, { rejectWithValue }) => {
    try {
      const res = await api.post("/payments/checkout", {
        nonce,
        orderId,
      });

      const { code, data } = res.data;

      return {
        code,
        payment: data.payment,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      return rejectWithValue({ code });
    }
  }
);

/**
 * 🔑 Sinh client token (Braintree)
 */
export const generateClientToken = createAsyncThunk(
  "payments/generateClientToken",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/payments/client-token");

      const { code, data } = res.data;

      return {
        code,
        clientToken: data.clientToken,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      return rejectWithValue({ code });
    }
  }
);

export const refundTransaction = createAsyncThunk(
  "payments/refundTransaction",
  async (transactionId, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/payments/refund/${transactionId}`);
      dispatch(
        addToast({
          type: "success",
          message: "Hoàn tiền thành công",
        })
      );
      return res.data;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.response?.data?.error || "Hoàn tiền thất bại",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const fetchPaymentSummary = createAsyncThunk(
  "payments/fetchSummary",
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);

      const res = await api.get(`/payments/summary?${query.toString()}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// 🧾 Tạo thanh toán mới (khi user checkout)
export const createPayment = createAsyncThunk(
  "payments/create",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/payments", formData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 🧾 Cập nhật thanh toán (trạng thái / note / kết quả Braintree)
export const updatePayment = createAsyncThunk(
  "payments/update",
  async ({ id, ...formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/payments/${id}`, formData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * ❌ Xóa nhiều thanh toán
 */
export const deleteManyPayments = createAsyncThunk(
  "payments/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/payments/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "PAYMENT_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const previewExportPayments = createAsyncThunk(
  "payments/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportPaymentsApi(payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;

      const code = res?.code || "PAYMENT_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const exportPayments = createAsyncThunk(
  "payments/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportPaymentsApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "payments_export";

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.PAYMENT_EXPORT_SUCCESS || {
        type: "success",
        message: "Xuất thanh toán thành công",
      };

      dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;

      const code = res?.code || "PAYMENT_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
