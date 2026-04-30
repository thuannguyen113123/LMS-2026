import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchCategories,
  fetchPublicCategories,
  createCategory,
  updateCategory,
  createManyCategories,
  deleteManyCategories,
  previewExportCategories,
  exportCategories,
  fetchCategoryOptions,
} from "./categoriesThunks";

export const categoriesAdapter = createEntityAdapter({
  selectId: (category) => category.id,
  sortComparer: (a, b) => (a.name ?? "").localeCompare(b.name ?? ""),
});

const initialState = categoriesAdapter.getInitialState({
  lists: {
    admin: [],
    public: [],
  },

  loading: {
    admin: false,
    public: false,
    create: false,
    update: false,
    bulkCreate: false,
    bulkDelete: false,
    export: false,
  },
  error: null,
  errorCode: null,

  lastActionCode: null,
  lastBulkSummary: null,

  exportPreview: null,
  previewLoading: false,
  recentlyUpdatedIds: [],
  options: [],
  optionsLoading: false,

  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  paginationPublic: {
    nextCursor: null,
    hasMore: false,
  },
});

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setRecentlyUpdated: (state, action) => {
      state.recentlyUpdatedIds.push(action.payload);
    },
    clearRecentlyUpdated(state, action) {
      state.recentlyUpdatedIds = state.recentlyUpdatedIds.filter(
        (id) => id !== action.payload
      );
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchCategories.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { categories, pagination } = action.payload;

        categoriesAdapter.upsertMany(state, categories);

        state.lists.admin = categories.map((c) => c.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchPublicCategories.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.loading.public = true;
        }
      })

      .addCase(fetchPublicCategories.fulfilled, (state, action) => {
        state.loading.public = false;

        const { categories, pagination } = action.payload;

        categoriesAdapter.upsertMany(state, categories);

        if (action.meta.arg?.isLoadMore) {
          state.lists.public.push(...categories.map((c) => c.id));
        } else {
          state.lists.public = categories.map((c) => c.id);
        }

        state.paginationPublic.nextCursor = pagination?.nextCursor || null;
        state.paginationPublic.hasMore = pagination?.hasMore ?? false;
      })

      .addCase(fetchPublicCategories.rejected, (state, action) => {
        state.loading.public = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchCategoryOptions.pending, (state) => {
        state.optionsLoading = true;
      })
      .addCase(fetchCategoryOptions.fulfilled, (state, action) => {
        state.optionsLoading = false;
        state.options = action.payload;
      })
      .addCase(fetchCategoryOptions.rejected, (state) => {
        state.optionsLoading = false;
      })
      .addCase(createCategory.pending, (state) => {
        state.loading.create = true;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading.create = false;
        const category = action.payload.category;

        categoriesAdapter.addOne(state, category);

        state.lists.admin.unshift(category.id);
        state.recentlyUpdatedIds.push(category.id);
      })
      .addCase(createCategory.rejected, (state) => {
        state.loading.create = false;
      })
      .addCase(updateCategory.pending, (state) => {
        state.loading.update = true;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading.update = false;
        const category = action.payload.category;
        categoriesAdapter.updateOne(state, {
          id: action.payload.category.id,
          changes: action.payload.category,
        });
        state.recentlyUpdatedIds.push(category.id);
      })
      .addCase(updateCategory.rejected, (state) => {
        state.loading.update = false;
      })
      .addCase(createManyCategories.pending, (state) => {
        state.loading.bulkCreate = true;
      })
      .addCase(createManyCategories.fulfilled, (state, action) => {
        state.loading.bulkCreate = false;

        state.lastActionCode = action.payload.code;

        if (action.payload.created?.length) {
          categoriesAdapter.addMany(state, action.payload.created);

          state.lists.admin.unshift(...action.payload.created.map((c) => c.id));

          // highlight tất cả item mới
          state.recentlyUpdatedIds.push(
            ...action.payload.created.map((c) => c.id)
          );
        }

        state.lastBulkSummary = action.payload.summary;
      })

      .addCase(createManyCategories.rejected, (state) => {
        state.loading.bulkCreate = false;
      })
      .addCase(deleteManyCategories.pending, (state) => {
        state.loading.bulkDelete = true;
      })
      .addCase(deleteManyCategories.fulfilled, (state, action) => {
        const ids = action.payload.deletedIds;

        categoriesAdapter.removeMany(state, ids);

        state.lists.admin = state.lists.admin.filter((id) => !ids.includes(id));
      })
      .addCase(deleteManyCategories.rejected, (state) => {
        state.loading.bulkDelete = false;
      })

      .addCase(previewExportCategories.pending, (state) => {
        state.previewLoading = true;
      })

      .addCase(previewExportCategories.fulfilled, (state, action) => {
        state.previewLoading = false;

        state.lastActionCode = action.payload.code;

        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportCategories.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(exportCategories.pending, (state) => {
        state.loading.export = true;
      })

      .addCase(exportCategories.fulfilled, (state) => {
        state.loading.export = false;

        state.lastActionCode = "CATEGORY_EXPORT_SUCCESS";
      })

      .addCase(exportCategories.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});
export const { clearRecentlyUpdated, setRecentlyUpdated } =
  categoriesSlice.actions;

export default categoriesSlice.reducer;
export const {
  selectAll: selectAllCategories,
  selectById: selectCategoryById,
  selectIds: selectCategoryIds,
} = categoriesAdapter.getSelectors((state) => state.categories);
export const selectAdminCategories = createSelector(
  [
    (state) => state.categories.lists.admin,
    (state) => state.categories.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);

export const selectPublicCategories = createSelector(
  [
    (state) => state.categories.lists.public,
    (state) => state.categories.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);
export const selectCategoryOptions = (state) =>
  state.categories.options.map((c) => ({
    label: c.name,
    value: c.id,
  }));

export const selectCategoryFilterOptions = (state) =>
  state.categories.options.map((c) => ({
    label: c.name,
    value: c.slug,
  }));
export const selectCategoryLoading = (state) => state.categories.loading;

export const selectAdminCategoryLoading = (state) =>
  state.categories.loading.admin;

export const selectPublicCategoryLoading = (state) =>
  state.categories.loading.public;

export const selectCategoryCreateLoading = (state) =>
  state.categories.loading.create;

export const selectCategorySubmitting = (state) =>
  state.categories.loading.submit;

export const selectCategoryDeleting = (state) =>
  state.categories.loading.delete;

export const selectInlineUpdating = (id) => (state) =>
  state.categories.loading.inlineUpdate[id];
