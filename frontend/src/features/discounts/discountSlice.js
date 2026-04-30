import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import {
  fetchDiscounts,
  fetchDiscountDetail,
  createDiscount,
  createManyDiscounts,
  updateDiscount,
  deleteManyDiscounts,
  applyDiscount,
  previewExportDiscounts,
  exportDiscounts,
  fetchFeaturedDiscount,
} from "./discountThunks";

// Adapter giúp tạo selector nhanh
const discountsAdapter = createEntityAdapter({
  selectId: (discount) => discount.id || discount._id,
});

const initialState = discountsAdapter.getInitialState({
  currentDiscount: null,
  appliedDiscount: null,
  discountAmount: 0,
  finalTotal: null,
  errorCode: null,
  lastActionCode: null,
  loading: {
    admin: false,
    detail: false,
    create: false,
    createMany: false,
    update: false,
    deleteMany: false,
    apply: false,
    export: false,
  },
  error: null,
  lastBulkSummary: null,
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
  recentlyUpdatedIds: [],
  featuredDiscount: null,
  loadingFeatured: false,
});

const discountSlice = createSlice({
  name: "discounts",
  initialState,
  reducers: {
    setCurrentDiscount(state, action) {
      state.currentDiscount = action.payload;
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
      // FETCH ALL
      .addCase(fetchDiscounts.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchDiscounts.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { discounts, pagination } = action.payload;

        discountsAdapter.upsertMany(state, discounts);

        state.lists.admin = discounts.map((d) => d.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchDiscounts.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchFeaturedDiscount.pending, (state) => {
        state.loadingFeatured = true;
      })

      .addCase(fetchFeaturedDiscount.fulfilled, (state, action) => {
        state.loadingFeatured = false;
        state.featuredDiscount = action.payload;

        // optional: cache vào entity luôn
        if (action.payload) {
          discountsAdapter.upsertOne(state, action.payload);
        }
      })

      .addCase(fetchFeaturedDiscount.rejected, (state, action) => {
        state.loadingFeatured = false;
        state.errorCode = action.payload?.code;
      })
      // FETCH DETAIL
      .addCase(fetchDiscountDetail.pending, (state) => {
        state.loading.detail = true;
        state.error = null;
      })
      .addCase(fetchDiscountDetail.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentDiscount = action.payload;
      })
      .addCase(fetchDiscountDetail.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createDiscount.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createDiscount.fulfilled, (state, action) => {
        state.loading.create = false;

        const discount = action.payload.discount;

        if (!discount) return;

        discountsAdapter.addOne(state, discount);

        state.lists.admin.unshift(discount.id);

        state.recentlyUpdatedIds.push(discount.id);
      })

      .addCase(createDiscount.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code;
      })

      // CREATE MANY
      .addCase(createManyDiscounts.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })
      .addCase(createManyDiscounts.fulfilled, (state, action) => {
        state.loading.createMany = false;
        state.lastActionCode = action.payload.code;

        const created = action.payload.created || [];

        if (created.length) {
          discountsAdapter.addMany(state, created);

          const createdIds = created.map((d) => d.id);

          state.lists.admin.unshift(...createdIds);

          // ⭐ highlight bulk rows
          state.recentlyUpdatedIds.push(...createdIds);
        }

        state.lastBulkSummary = action.payload.summary;
      })

      .addCase(createManyDiscounts.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      // APPLY DISCOUNT
      .addCase(applyDiscount.pending, (state) => {
        state.loading.apply = true;
        state.errorCode = null;
      })

      .addCase(applyDiscount.fulfilled, (state, action) => {
        state.loading.apply = false;
        state.lastActionCode = action.payload.code;

        state.appliedDiscount = action.payload.discount;
        state.discountAmount = action.payload.discountAmount;
        state.finalTotal = action.payload.finalTotal;
      })

      .addCase(applyDiscount.rejected, (state, action) => {
        state.loading.apply = false;
        state.errorCode = action.payload?.code;

        state.appliedDiscount = null;
        state.discountAmount = 0;
        state.finalTotal = null;
      })

      // UPDATE
      .addCase(updateDiscount.pending, (state) => {
        state.loading.update = true;
      })
      .addCase(updateDiscount.fulfilled, (state, action) => {
        state.loading.update = false;

        const discount = action.payload.discount;

        discountsAdapter.upsertOne(state, discount);

        // ⭐ highlight row vừa update
        state.recentlyUpdatedIds.push(discount.id);
      })
      .addCase(updateDiscount.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload;
      })

      // DELETE MANY
      .addCase(deleteManyDiscounts.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })

      .addCase(deleteManyDiscounts.fulfilled, (state, action) => {
        state.loading.deleteMany = false;
        state.lastActionCode = action.payload.code;

        const ids = action.payload.deletedIds;

        discountsAdapter.removeMany(state, ids);

        Object.keys(state.lists).forEach((key) => {
          state.lists[key] = state.lists[key].filter((id) => !ids.includes(id));
        });
      })

      .addCase(deleteManyDiscounts.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(previewExportDiscounts.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportDiscounts.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportDiscounts.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(exportDiscounts.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportDiscounts.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "DISCOUNT_EXPORT_SUCCESS";
      })

      .addCase(exportDiscounts.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const { setCurrentDiscount, setRecentlyUpdated, clearRecentlyUpdated } =
  discountSlice.actions;

export default discountSlice.reducer;

// Selectors
export const {
  selectAll: selectAllDiscounts,
  selectById: selectDiscountById,
  selectIds: selectDiscountIds,
} = discountsAdapter.getSelectors((state) => state.discounts);
export const selectAdminDiscounts = (state) =>
  state.discounts.lists.admin
    .map((id) => state.discounts.entities[id])
    .filter(Boolean);

export const selectDiscountLoading = (state) => state.discounts.loading;

export const selectAdminDiscountsLoading = (state) =>
  state.discounts.loading.admin;

export const selectDiscountDetailLoading = (state) =>
  state.discounts.loading.detail;

export const selectExportDiscountsLoading = (state) =>
  state.discounts.loading.export;
export const selectFeaturedDiscount = (state) =>
  state.discounts.featuredDiscount;

export const selectFeaturedDiscountLoading = (state) =>
  state.discounts.loadingFeatured;
