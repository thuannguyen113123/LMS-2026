import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import {
  fetchPayments,
  createTransaction,
  updatePayment,
  generateClientToken,
  refundTransaction,
  fetchPaymentSummary,
  deleteManyPayments,
  exportPayments,
  previewExportPayments,
} from "./paymentsThunks";

// ===== Entity adapter =====
const paymentsAdapter = createEntityAdapter({
  selectId: (payment) => payment._id || payment.id,
});

// ===== Initial State =====
const initialState = paymentsAdapter.getInitialState({
  loading: {
    admin: false,
    create: false,
    update: false,
    refund: false,
    deleteMany: false,
    export: false,
    summary: false,
  },
  error: null,
  successMessage: null,
  currentPayment: null,
  clientToken: null,
  summary: [],

  errorCode: null,
  lastActionCode: null,
  exportPreview: null,
  previewLoading: false,
  lists: {
    admin: [],
  },
  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
});

// ===== Slice =====
const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    setCurrentPayment(state, action) {
      state.currentPayment = action.payload;
    },

    resetPagination(state) {
      state.paginationAdmin = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },

    clearMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== FETCH ALL =====
      .addCase(fetchPayments.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { payments, pagination } = action.payload;

        paymentsAdapter.upsertMany(state, payments);

        state.lists.admin = payments.map((p) => p.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      // ===== CREATE TRANSACTION =====
      .addCase(createTransaction.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading.create = false;

        if (action.payload.payment) {
          paymentsAdapter.addOne(state, action.payload.payment);

          state.lists.admin.unshift(action.payload.payment.id);
        }

        state.lastActionCode = action.payload.code;
      })

      .addCase(createTransaction.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code || null;
      })

      // ===== UPDATE PAYMENT =====
      .addCase(updatePayment.pending, (state) => {
        state.loading.update = true;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.loading.update = false;

        paymentsAdapter.upsertOne(state, action.payload);

        state.lastActionCode = "PAYMENT_UPDATE_SUCCESS";
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload || "Cập nhật thanh toán thất bại!";
      })

      // ===== CLIENT TOKEN =====
      .addCase(generateClientToken.pending, (state) => {
        state.clientToken = null;
        state.errorCode = null;
      })

      .addCase(generateClientToken.fulfilled, (state, action) => {
        state.lastActionCode = action.payload.code;
        state.clientToken = action.payload.clientToken;
      })

      .addCase(generateClientToken.rejected, (state, action) => {
        state.errorCode = action.payload?.code || null;
      })

      // ===== REFUND TRANSACTION =====
      .addCase(refundTransaction.pending, (state) => {
        state.loading.refund = true;
      })
      .addCase(refundTransaction.fulfilled, (state, action) => {
        state.loading.refund = false;

        paymentsAdapter.upsertOne(state, action.payload);

        state.lastActionCode = "PAYMENT_REFUND_SUCCESS";
      })
      .addCase(refundTransaction.rejected, (state, action) => {
        state.loading.refund = false;
        state.error = action.payload || "Hoàn tiền thất bại!";
      })

      // ===== SUMMARY =====
      .addCase(fetchPaymentSummary.pending, (state) => {
        state.loading.summary = true;
      })
      .addCase(fetchPaymentSummary.fulfilled, (state, action) => {
        state.loading.summary = false;
        state.summary = action.payload;
      })
      .addCase(fetchPaymentSummary.rejected, (state, action) => {
        state.loading.summary = false;
        state.error = action.payload || "Không thể lấy thống kê!";
      })

      // ===== DELETE MANY =====
      .addCase(deleteManyPayments.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })

      .addCase(deleteManyPayments.fulfilled, (state, action) => {
        state.loading.deleteMany = false;

        const ids = action.payload.deletedIds;

        paymentsAdapter.removeMany(state, ids);

        state.lists.admin = state.lists.admin.filter((id) => !ids.includes(id));

        state.lastActionCode = action.payload.code;
      })
      .addCase(deleteManyPayments.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(previewExportPayments.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportPayments.fulfilled, (state, action) => {
        state.previewLoading = false;

        state.lastActionCode = action.payload.code;

        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportPayments.rejected, (state, action) => {
        state.previewLoading = false;

        state.errorCode = action.payload?.code;
      })
      .addCase(exportPayments.pending, (state) => {
        state.loading.export = true;

        state.errorCode = null;
      })

      .addCase(exportPayments.fulfilled, (state) => {
        state.loading.export = false;

        state.lastActionCode = "PAYMENT_EXPORT_SUCCESS";
      })

      .addCase(exportPayments.rejected, (state, action) => {
        state.loading.export = false;

        state.errorCode = action.payload?.code;
      });
  },
});

// ===== Actions =====
export const { setCurrentPayment, resetPagination, clearMessages } =
  paymentsSlice.actions;

// ===== Reducer =====
export default paymentsSlice.reducer;

// ===== Selectors =====
export const {
  selectAll: selectAllPayments,
  selectById: selectPaymentById,
  selectIds: selectPaymentIds,
} = paymentsAdapter.getSelectors((state) => state.payments);

export const selectAdminPayments = (state) =>
  state.payments.lists.admin
    .map((id) => state.payments.entities[id])
    .filter(Boolean);
export const selectPaymentLoading = (state) => state.payments.loading;

export const selectAdminPaymentsLoading = (state) =>
  state.payments.loading.admin;

export const selectRefundTransactionLoading = (state) =>
  state.payments.loading.refund;

export const selectExportPaymentsLoading = (state) =>
  state.payments.loading.export;
