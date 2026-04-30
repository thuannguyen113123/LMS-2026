import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import {
  exportDiscountsApi,
  previewExportDiscountsApi,
} from "../../app/discountApi";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  DISCOUNT_CREATED: {
    type: "success",
    title: "Mã giảm giá",
    message: "Tạo mã giảm giá thành công",
  },

  DISCOUNT_EXISTS: {
    type: "error",
    title: "Mã giảm giá",
    message: "Mã giảm giá đã tồn tại",
  },

  DISCOUNT_CREATE_FAILED: {
    type: "error",
    title: "Mã giảm giá",
    message: "Tạo mã giảm giá thất bại",
  },
  DISCOUNT_BULK_CREATED: {
    type: "success",
    title: "Mã giảm giá",
    message: "Import mã giảm giá thành công",
  },

  DISCOUNT_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Mã giảm giá",
    message: "Danh sách mã giảm giá không hợp lệ",
  },

  DISCOUNT_BULK_VALIDATION_FAILED: {
    type: "warning",
    title: "Mã giảm giá",
    message: "Có dòng dữ liệu không hợp lệ",
  },

  DISCOUNT_BULK_DUPLICATE_IN_FILE: {
    type: "warning",
    title: "Mã giảm giá",
    message: "Có mã giảm giá bị trùng trong file",
  },

  DISCOUNT_ALREADY_EXISTS: {
    type: "warning",
    title: "Mã giảm giá",
    message: "Một số mã giảm giá đã tồn tại",
  },

  DISCOUNT_BULK_CREATE_FAILED: {
    type: "error",
    title: "Mã giảm giá",
    message: "Import mã giảm giá thất bại",
  },
  DISCOUNT_DELETE_SUCCESS: {
    type: "success",
    title: "Mã giảm giá",
    message: "Xóa mã giảm giá thành công",
  },

  DISCOUNT_DELETE_FAILED: {
    type: "error",
    title: "Mã giảm giá",
    message: "Xóa mã giảm giá thất bại",
  },

  DISCOUNT_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Mã giảm giá",
    message: "Không có mã giảm giá để xóa",
  },
  DISCOUNT_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Mã giảm giá",
    message: "Đã tạo dữ liệu xem trước export",
  },

  DISCOUNT_EXPORT_SUCCESS: {
    type: "success",
    title: "Mã giảm giá",
    message: "Xuất mã giảm giá thành công",
  },

  DISCOUNT_EXPORT_EMPTY: {
    type: "warning",
    title: "Mã giảm giá",
    message: "Không có dữ liệu để export",
  },

  DISCOUNT_EXPORT_SCOPE_INVALID: {
    type: "error",
    title: "Mã giảm giá",
    message: "Phạm vi export không hợp lệ",
  },

  DISCOUNT_EXPORT_SELECTED_EMPTY: {
    type: "warning",
    title: "Mã giảm giá",
    message: "Chưa chọn mã giảm giá để export",
  },

  DISCOUNT_EXPORT_FORMAT_INVALID: {
    type: "error",
    title: "Mã giảm giá",
    message: "Định dạng export không hợp lệ",
  },

  DISCOUNT_EXPORT_FAILED: {
    type: "error",
    title: "Mã giảm giá",
    message: "Xuất mã giảm giá thất bại",
  },
  DISCOUNT_APPLIED: {
    type: "success",
    title: "Mã giảm giá",
    message: "Áp dụng mã giảm giá thành công",
  },

  DISCOUNT_EXPIRED: {
    type: "error",
    title: "Mã giảm giá",
    message: "Mã đã hết hạn",
  },

  DISCOUNT_USAGE_LIMIT_REACHED: {
    type: "error",
    title: "Mã giảm giá",
    message: "Mã đã hết lượt sử dụng",
  },

  DISCOUNT_MIN_ORDER_NOT_MET: {
    type: "warning",
    title: "Mã giảm giá",
    message: "Đơn hàng chưa đạt giá trị tối thiểu",
  },
};

// 🟢 Lấy danh sách mã giảm giá
export const fetchDiscounts = createAsyncThunk(
  "discounts/adminList",

  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/discounts?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "DISCOUNT_LIST_FAILED",
      });
    }
  }
);
export const fetchFeaturedDiscount = createAsyncThunk(
  "discounts/fetchFeatured",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/discounts/featured");

      return res.data.data; // chỉ lấy discount
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "DISCOUNT_LIST_FAILED",
      });
    }
  },
  {
    getPendingMeta: () => ({ page: true }),
  }
);

// 🟢 Lấy chi tiết mã giảm giá
export const fetchDiscountDetail = createAsyncThunk(
  "discounts/fetchDetail",
  async (id, { dispatch, rejectWithValue }) => {
    if (!id) return rejectWithValue("ID không hợp lệ");
    try {
      const res = await api.get(`/discounts/${id}`);
      return res.data.discount;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message:
            err.response?.data?.error || "Không thể tải chi tiết mã giảm giá",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// 🟢 Tạo mã giảm giá
export const createDiscount = createAsyncThunk(
  "discounts/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/discounts", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        discount: data.discount,
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

// 🟢 Tạo nhiều mã giảm giá
export const createManyDiscounts = createAsyncThunk(
  "discounts/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/discounts/bulk", payloadList);

      const { code, data, summary } = res.data;

      if (code === "DISCOUNT_BULK_CREATED") {
        const { created, skipped, failed } = summary;

        dispatch(
          addToast({
            type: failed > 0 ? "warning" : "success",
            title: "Import mã giảm giá",
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
      const code = res?.code || "DISCOUNT_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 🟣 Áp dụng mã giảm giá
export const applyDiscount = createAsyncThunk(
  "discounts/apply",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/discounts/apply", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        ...data,
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

// 🟡 Cập nhật mã giảm giá
export const updateDiscount = createAsyncThunk(
  "discounts/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, ...data } = payload;

      const res = await api.put(`/discounts/${id}`, data);

      const { code, data: resData } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        discount: resData.discount,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "DISCOUNT_UPDATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue(code);
    }
  }
);

// 🔴 Xóa nhiều mã giảm giá
export const deleteManyDiscounts = createAsyncThunk(
  "discounts/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/discounts/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "DISCOUNT_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const previewExportDiscounts = createAsyncThunk(
  "discounts/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportDiscountsApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "DISCOUNT_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const exportDiscounts = createAsyncThunk(
  "discounts/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportDiscountsApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "discounts_export";
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.DISCOUNT_EXPORT_SUCCESS;
      if (toast) dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "DISCOUNT_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
