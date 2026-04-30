import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import { exportOrdersApi, previewExportOrdersApi } from "../../app/orderApi";
import { buildQueryString } from "../courses/coursesThunks";

export const toastMap = {
  ORDER_CREATED: {
    type: "success",
    title: "Đơn hàng",
    message: "Đặt hàng thành công",
  },

  ORDER_ITEMS_EMPTY: {
    type: "warning",
    title: "Đơn hàng",
    message: "Chưa có sản phẩm trong đơn hàng",
  },

  ORDER_INVALID_PAYLOAD: {
    type: "error",
    title: "Đơn hàng",
    message: "Dữ liệu đơn hàng không hợp lệ",
  },

  ORDER_CREATE_FAILED: {
    type: "error",
    title: "Đơn hàng",
    message: "Tạo đơn hàng thất bại",
  },
  ORDER_BULK_CREATED: {
    type: "success",
    title: "Đơn hàng",
    message: "Import đơn hàng thành công",
  },

  ORDER_BULK_INVALID_PAYLOAD: {
    type: "error",
    title: "Đơn hàng",
    message: "Danh sách đơn hàng không hợp lệ",
  },

  ORDER_BULK_VALIDATION_FAILED: {
    type: "warning",
    title: "Đơn hàng",
    message: "Có dòng dữ liệu không hợp lệ",
  },

  ORDER_USER_NOT_FOUND: {
    type: "warning",
    title: "Đơn hàng",
    message: "Một số user không tồn tại",
  },

  ORDER_PRODUCT_NOT_FOUND: {
    type: "warning",
    title: "Đơn hàng",
    message: "Một số sản phẩm không tồn tại",
  },

  ORDER_BULK_CREATE_FAILED: {
    type: "error",
    title: "Đơn hàng",
    message: "Import đơn hàng thất bại",
  },
  ORDER_DELETE_SUCCESS: {
    type: "success",
    title: "Đơn hàng",
    message: "Xóa đơn hàng thành công",
  },

  ORDER_DELETE_FAILED: {
    type: "error",
    title: "Đơn hàng",
    message: "Xóa đơn hàng thất bại",
  },

  ORDER_DELETE_EMPTY_IDS: {
    type: "warning",
    title: "Đơn hàng",
    message: "Chưa chọn đơn hàng để xóa",
  },

  ORDER_NOT_FOUND: {
    type: "error",
    title: "Đơn hàng",
    message: "Một số đơn hàng không tồn tại",
  },
  // ===== ORDER EXPORT =====

  ORDER_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Đơn hàng",
    message: "Đã tạo dữ liệu xem trước export",
  },

  ORDER_EXPORT_SUCCESS: {
    type: "success",
    title: "Đơn hàng",
    message: "Xuất đơn hàng thành công",
  },

  ORDER_EXPORT_EMPTY: {
    type: "warning",
    title: "Đơn hàng",
    message: "Không có dữ liệu để export",
  },

  ORDER_EXPORT_SCOPE_INVALID: {
    type: "error",
    title: "Đơn hàng",
    message: "Phạm vi export không hợp lệ",
  },

  ORDER_EXPORT_SELECTED_EMPTY: {
    type: "warning",
    title: "Đơn hàng",
    message: "Chưa chọn đơn hàng để export",
  },

  ORDER_EXPORT_FORMAT_INVALID: {
    type: "error",
    title: "Đơn hàng",
    message: "Định dạng export không hợp lệ",
  },

  ORDER_EXPORT_FAILED: {
    type: "error",
    title: "Đơn hàng",
    message: "Xuất đơn hàng thất bại",
  },
  ORDER_UPDATED: {
    type: "success",
    title: "Đơn hàng",
    message: "Cập nhật đơn hàng thành công",
  },

  ORDER_UPDATE_FAILED: {
    type: "error",
    title: "Đơn hàng",
    message: "Cập nhật đơn hàng thất bại",
  },
};

/**
 Tạo đơn hàng (Order)
 */
export const createOrder = createAsyncThunk(
  "orders/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/orders", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        order: data.order,
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

// 📦 Tạo nhiều đơn hàng (bulk)
export const createManyOrders = createAsyncThunk(
  "orders/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/orders/bulk", payloadList);

      const { code, data, summary } = res.data;

      // toast summary giống course
      if (code === "ORDER_BULK_CREATED") {
        const { created, failed } = summary;

        dispatch(
          addToast({
            type: failed > 0 ? "warning" : "success",
            title: "Import đơn hàng",
            message: `Hoàn tất: ${created} tạo mới • ${failed} lỗi`,
          })
        );
      } else {
        const toast = toastMap[code];
        if (toast) dispatch(addToast(toast));
      }

      return {
        code,
        created: data.created,
        errors: data.errors,
        summary,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "ORDER_BULK_CREATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 📄 Lấy danh sách đơn hàng
// =========================================================== */
export const fetchOrders = createAsyncThunk(
  "orders/adminList",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/orders?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async (args = {}, { rejectWithValue }) => {
    try {
      const { cursor = null, limit = 8, status = "all" } = args;

      const params = buildQueryString({
        cursor,
        limit,
        status,
      });

      const res = await api.get(`/orders/my-orders?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
// 🔧 Cập nhật đơn hàng (admin) chỉ 2 trường: status, paymentId
export const updateOrder = createAsyncThunk(
  "orders/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { id, status, paymentId } = payload;

      const res = await api.put(`/orders/${id}`, {
        status,
        paymentId,
      });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        order: data.order,
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

// 🛑 Hủy đơn hàng (user/admin)
export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(`/orders/${id}/cancel`);

      dispatch(
        addToast({
          type: "success",
          title: "Hủy đơn hàng",
          message: "Đơn hàng đã được hủy thành công!",
          duration: 5000,
        })
      );

      return res.data.order;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Hủy thất bại",
          message: err.response?.data?.error || "Lỗi khi hủy đơn hàng",
          duration: 5000,
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

//  Xóa nhiều đơn hàng (admin)
export const deleteManyOrders = createAsyncThunk(
  "orders/deleteManyOrders",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/orders/delete-many", { ids });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
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

export const previewExportOrders = createAsyncThunk(
  "orders/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportOrdersApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "ORDER_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const exportOrders = createAsyncThunk(
  "orders/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportOrdersApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "orders_export";

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.ORDER_EXPORT_SUCCESS || {
        type: "success",
        message: "Xuất đơn hàng thành công",
      };

      dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "ORDER_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
