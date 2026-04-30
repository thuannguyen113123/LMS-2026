import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchInstructors,
  fetchInstructorDetailBySlug,
  createInstructor,
  createManyInstructors,
  updateInstructor,
  deleteManyInstructors,
  previewExportInstructors,
  exportInstructors,
  fetchPublicInstructors,
  fetchInstructorFilterOptions,
  fetchInstructorOptions,
} from "./instructorsThunks";

const instructorsAdapter = createEntityAdapter({
  selectId: (ins) => ins.id || ins._id,
});

const initialState = instructorsAdapter.getInitialState({
  currentInstructor: null,

  lists: {
    admin: [],
    public: [],
  },

  loading: {
    admin: false,
    public: false,
    detail: false,

    create: false,
    createMany: false,
    update: false,
    deleteMany: false,

    export: false,
  },
  error: null,
  errorCode: null,

  lastActionCode: null,
  lastBulkSummary: null,

  exportPreview: null,
  previewLoading: false,
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
  filterOptions: {
    expertise: [],
  },

  filterLoading: false,
  recentlyUpdatedIds: [],
});

const instructorsSlice = createSlice({
  name: "instructors",
  initialState,
  reducers: {
    setCurrentInstructor(state, action) {
      state.currentInstructor = action.payload;
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

      .addCase(fetchInstructors.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { instructors, pagination } = action.payload;

        instructorsAdapter.upsertMany(state, instructors);

        state.lists.admin = instructors.map((i) => i.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchInstructors.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchPublicInstructors.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.loading.public = true;
        }
      })

      .addCase(fetchPublicInstructors.fulfilled, (state, action) => {
        const { instructors, pagination } = action.payload;

        state.loading.public = false;

        instructorsAdapter.upsertMany(state, instructors);

        if (action.meta.arg?.isLoadMore) {
          state.lists.public.push(...instructors.map((i) => i.id));
        } else {
          state.lists.public = instructors.map((i) => i.id);
        }

        state.paginationPublic.nextCursor = pagination?.nextCursor || null;
        state.paginationPublic.hasMore = pagination?.hasNext ?? false;
      })

      .addCase(fetchPublicInstructors.rejected, (state, action) => {
        state.loading.public = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchInstructorOptions.pending, (state) => {
        state.optionsLoading = true;
      })
      .addCase(fetchInstructorOptions.fulfilled, (state, action) => {
        state.optionsLoading = false;
        state.options = action.payload;
      })
      .addCase(fetchInstructorOptions.rejected, (state) => {
        state.optionsLoading = false;
      })
      .addCase(fetchInstructorFilterOptions.pending, (state) => {
        state.filterLoading = true;
      })

      .addCase(fetchInstructorFilterOptions.fulfilled, (state, action) => {
        state.filterLoading = false;

        state.filterOptions.expertise = action.payload.expertise || [];
      })

      .addCase(fetchInstructorFilterOptions.rejected, (state, action) => {
        state.filterLoading = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchInstructorDetailBySlug.pending, (state) => {
        state.loading.detail = true;
      })
      .addCase(fetchInstructorDetailBySlug.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentInstructor = action.payload;
      })
      .addCase(fetchInstructorDetailBySlug.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(createInstructor.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createInstructor.fulfilled, (state, action) => {
        state.loading.create = false;
        state.lastActionCode = action.payload.code;

        const instructor = action.payload.instructor;

        if (instructor) {
          instructorsAdapter.addOne(state, instructor);

          state.lists.admin.unshift(instructor.id);

          state.recentlyUpdatedIds.push(instructor.id);
        }
      })

      .addCase(createInstructor.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(createManyInstructors.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })

      .addCase(createManyInstructors.fulfilled, (state, action) => {
        state.loading.createMany = false;

        state.lastActionCode = action.payload.code;

        if (action.payload.created?.length) {
          instructorsAdapter.addMany(state, action.payload.created);

          const createdIds = action.payload.created.map((i) => i.id);

          state.lists.admin.unshift(...createdIds);

          state.recentlyUpdatedIds.push(...createdIds);
        }

        state.lastBulkSummary = action.payload.summary;
      })

      .addCase(createManyInstructors.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(updateInstructor.pending, (state) => {
        state.loading.update = true;
        state.errorCode = null;
      })

      .addCase(updateInstructor.fulfilled, (state, action) => {
        state.loading.update = false;

        state.lastActionCode = action.payload.code;

        const instructor = action.payload.instructor;

        if (instructor) {
          instructorsAdapter.upsertOne(state, instructor);

          state.recentlyUpdatedIds.push(instructor.id);
        }
      })

      .addCase(updateInstructor.rejected, (state, action) => {
        state.loading.update = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(deleteManyInstructors.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })

      .addCase(deleteManyInstructors.fulfilled, (state, action) => {
        state.loading.deleteMany = false;
        state.lastActionCode = action.payload.code;

        const ids = action.payload.deletedIds;

        instructorsAdapter.removeMany(state, ids);

        Object.keys(state.lists).forEach((key) => {
          state.lists[key] = state.lists[key].filter((id) => !ids.includes(id));
        });
      })

      .addCase(deleteManyInstructors.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(previewExportInstructors.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportInstructors.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportInstructors.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })
      // ===== EXPORT INSTRUCTORS =====
      .addCase(exportInstructors.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportInstructors.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "INSTRUCTOR_EXPORT_SUCCESS";
      })

      .addCase(exportInstructors.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const {
  setCurrentInstructor,
  setRecentlyUpdated,
  clearRecentlyUpdated,
} = instructorsSlice.actions;
export default instructorsSlice.reducer;

export const {
  selectAll: selectAllInstructors,
  selectById: selectInstructorById,
  selectIds: selectInstructorIds,
} = instructorsAdapter.getSelectors((state) => state.instructors);

export const selectAdminInstructors = createSelector(
  [
    (state) => state.instructors.lists.admin,
    (state) => state.instructors.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);
export const selectPublicInstructors = createSelector(
  [
    (state) => state.instructors.lists.public,
    (state) => state.instructors.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);
export const selectInstructorFilterOptions = (state) =>
  state.instructors.filterOptions;

export const selectInstructorExpertiseOptions = (state) =>
  state.instructors.filterOptions.expertise;
export const selectInstructorOptions = (state) =>
  state.instructors.options.map((i) => ({
    label: i.name,
    value: i.id,
  }));
export const selectInstructorLoading = (state) => state.instructors.loading;
export const selectAdminInstructorsLoading = (state) =>
  state.instructors.loading.admin;

export const selectPublicInstructorsLoading = (state) =>
  state.instructors.loading.public;

export const selectInstructorDetailLoading = (state) =>
  state.instructors.loading.detail;

export const selectCreateInstructorLoading = (state) =>
  state.instructors.loading.create;

export const selectUpdateInstructorLoading = (state) =>
  state.instructors.loading.update;

export const selectDeleteInstructorLoading = (state) =>
  state.instructors.loading.delete;

export const selectExportInstructorLoading = (state) =>
  state.instructors.loading.export;

export const selectPreviewExportInstructorLoading = (state) =>
  state.instructors.loading.previewExport;

export const selectInstructorFilterLoading = (state) =>
  state.instructors.loading.filterOptions;
