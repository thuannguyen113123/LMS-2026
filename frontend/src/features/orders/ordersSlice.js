import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import {
  fetchOrders,
  createOrder,
  createManyOrders,
  updateOrder,
  cancelOrder,
  deleteManyOrders,
  previewExportOrders,
  exportOrders,
  fetchMyOrders,
} from "./ordersThunks";

// Adapter chuẩn: id = order.id, sort theo createdAt mới nhất
const ordersAdapter = createEntityAdapter({
  selectId: (order) => order.id,
});

const initialState = ordersAdapter.getInitialState({
  loading: {
    admin: false,

    create: false,
    createMany: false,
    update: false,
    cancel: false,

    deleteMany: false,
    export: false,
  },
  error: null,

  lastBulkSummary: null,
  errorCode: null,
  lastActionCode: null,
  exportPreview: null,
  previewLoading: false,
  lists: {
    admin: [],
    student: [],
  },
  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  recentlyUpdatedIds: [],
  paginationStudent: {
    nextCursor: null,
    hasNext: true,
  },

  studentLoading: false,
});

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    resetPagination(state) {
      state.paginationAdmin = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },
    setRecentlyUpdated: (state, action) => {
      state.recentlyUpdatedIds.push(action.payload);
    },

    clearRecentlyUpdated: (state, action) => {
      state.recentlyUpdatedIds = state.recentlyUpdatedIds.filter(
        (id) => id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOrders
      .addCase(fetchOrders.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { orders, pagination } = action.payload;

        ordersAdapter.upsertMany(state, orders);

        state.lists.admin = orders.map((o) => o.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchMyOrders.pending, (state) => {
        state.studentLoading = true;
      })

      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.studentLoading = false;

        const { data, pagination } = action.payload;
        const { cursor } = action.meta.arg;

        ordersAdapter.upsertMany(state, data);

        const newIds = data.map((o) => o.id);

        if (cursor) {
          state.lists.student.push(...newIds);
        } else {
          state.lists.student = newIds;
        }

        state.paginationStudent = pagination;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.studentLoading = false;
        state.errorCode = action.payload?.code;
      })
      // createOrder
      .addCase(createOrder.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading.create = false;

        const order = action.payload.order;

        ordersAdapter.addOne(state, order);

        state.lists.admin.unshift(order.id);

        // ⭐ highlight
        state.recentlyUpdatedIds.push(order.id);
      })

      .addCase(createOrder.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code || null;
      })
      .addCase(createManyOrders.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })

      // createManyOrders
      .addCase(createManyOrders.fulfilled, (state, action) => {
        state.loading.createMany = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.created?.length) {
          ordersAdapter.addMany(state, action.payload.created);

          const createdIds = action.payload.created.map((o) => o.id);

          state.lists.admin.unshift(...createdIds);

          // ⭐ highlight hàng loạt
          state.recentlyUpdatedIds.push(...createdIds);
        }

        state.lastBulkSummary = action.payload.summary;
      })

      .addCase(createManyOrders.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code || null;
      })

      // updateOrder
      .addCase(updateOrder.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading.update = false;

        const order = action.payload.order;

        ordersAdapter.updateOne(state, {
          id: order.id,
          changes: order,
        });

        state.recentlyUpdatedIds.push(order.id);
      })

      .addCase(updateOrder.rejected, (state, action) => {
        state.loading.update = false;
        state.errorCode = action.payload?.code || null;
      })
      // cancelOrder
      .addCase(cancelOrder.pending, (state) => {
        state.loading.cancel = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading.cancel = false;

        const order = action.payload;

        ordersAdapter.updateOne(state, {
          id: order.id,
          changes: order,
        });

        state.recentlyUpdatedIds.push(order.id);
      })

      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading.cancel = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(deleteManyOrders.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })

      .addCase(deleteManyOrders.fulfilled, (state, action) => {
        state.loading.deleteMany = false;

        const ids = action.payload.deletedIds;

        ordersAdapter.removeMany(state, ids);

        state.lists.admin = state.lists.admin.filter((id) => !ids.includes(id));
      })

      .addCase(deleteManyOrders.rejected, (state, action) => {
        state.loading.deleteMany = false;

        state.errorCode = action.payload?.code;
      })
      .addCase(previewExportOrders.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportOrders.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportOrders.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(exportOrders.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportOrders.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "ORDER_EXPORT_SUCCESS";
      })

      .addCase(exportOrders.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const { resetPagination, setRecentlyUpdated, clearRecentlyUpdated } =
  ordersSlice.actions;

export default ordersSlice.reducer;

// Selectors chuẩn từ adapter
export const {
  selectAll: selectAllOrders,
  selectById: selectOrderById,
  selectIds: selectOrderIds,
} = ordersAdapter.getSelectors((state) => state.orders);

export const selectAdminOrders = (state) =>
  state.orders.lists.admin
    .map((id) => state.orders.entities[id])
    .filter(Boolean);
export const selectStudentOrders = (state) =>
  state.orders.lists.student
    .map((id) => state.orders.entities[id])
    .filter(Boolean);

export const selectStudentOrdersPagination = (state) =>
  state.orders.paginationStudent;

export const selectStudentOrdersLoading = (state) =>
  state.orders.studentLoading;
export const selectOrderLoading = (state) => state.orders.loading;
export const selectCreateOrderLoading = (state) => state.orders.loading.create;
export const selectAdminOrdersLoading = (state) => state.orders.loading.admin;
