import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchLessons,
  fetchMyLessons,
  fetchPublicLessons,
  fetchLessonDetailBySlug,
  createLesson,
  createManyLessons,
  updateLesson,
  deleteManyLessons,
  previewExportLessons,
  exportLessons,
} from "./lessonsThunks";

const lessonsAdapter = createEntityAdapter({
  selectId: (lesson) => lesson.id,
});

const initialState = lessonsAdapter.getInitialState({
  currentLesson: null,

  lists: {
    admin: [],
    public: [],
    my: [],
  },
  loading: {
    admin: false,
    public: false,
    my: false,
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
  recentlyUpdatedIds: [],
});

const lessonsSlice = createSlice({
  name: "lessons",
  initialState,
  reducers: {
    setCurrentLesson(state, action) {
      state.currentLesson = action.payload;
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

      .addCase(fetchLessons.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchLessons.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { lessons, pagination } = action.payload;

        lessonsAdapter.upsertMany(state, lessons);

        state.lists.admin = lessons.map((l) => l.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchLessons.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchMyLessons.pending, (state) => {
        state.loading.my = true;
      })

      .addCase(fetchMyLessons.fulfilled, (state, action) => {
        state.loading.my = false;

        const data = action.payload;

        lessonsAdapter.upsertMany(state, data);

        state.lists.my = data.map((l) => l.id);
      })

      .addCase(fetchMyLessons.rejected, (state, action) => {
        state.loading.my = false;
        state.error = action.payload;
      })

      .addCase(fetchPublicLessons.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.loading.public = true;
        }
      })

      .addCase(fetchPublicLessons.fulfilled, (state, action) => {
        const { lessons, pagination } = action.payload;

        state.loading.public = false;

        lessonsAdapter.upsertMany(state, lessons);

        if (action.meta.arg?.isLoadMore) {
          state.lists.public.push(...lessons.map((l) => l.id));
        } else {
          state.lists.public = lessons.map((l) => l.id);
        }

        state.paginationPublic.nextCursor = pagination?.nextCursor || null;
        state.paginationPublic.hasMore = pagination?.hasMore ?? false;
      })

      .addCase(fetchPublicLessons.rejected, (state, action) => {
        state.loading.public = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchLessonDetailBySlug.pending, (state) => {
        state.loading.detail = true;
        state.error = null;
      })

      .addCase(fetchLessonDetailBySlug.fulfilled, (state, action) => {
        state.loading.detail = false;

        state.currentLesson = action.payload;
      })

      .addCase(fetchLessonDetailBySlug.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload;
      })

      .addCase(createLesson.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createLesson.fulfilled, (state, action) => {
        state.loading.create = false;

        const { lesson, code } = action.payload;

        state.lastActionCode = code;

        if (lesson) {
          lessonsAdapter.addOne(state, lesson);

          state.lists.admin.unshift(lesson.id);

          state.recentlyUpdatedIds.push(lesson.id);
        }
      })

      .addCase(createLesson.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(createManyLessons.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })

      .addCase(createManyLessons.fulfilled, (state, action) => {
        state.loading.createMany = false;

        state.lastActionCode = action.payload.code;

        if (action.payload.created?.length) {
          lessonsAdapter.addMany(state, action.payload.created);

          const ids = action.payload.created.map((l) => l.id);

          state.lists.admin.unshift(...ids);

          state.recentlyUpdatedIds.push(...ids);
        }

        state.lastBulkSummary = action.payload.summary;
      })

      .addCase(createManyLessons.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(updateLesson.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })

      .addCase(updateLesson.fulfilled, (state, action) => {
        state.loading.update = false;

        const lesson = action.payload.lesson;

        lessonsAdapter.upsertOne(state, lesson);

        state.recentlyUpdatedIds.push(lesson.id);
      })
      .addCase(updateLesson.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(deleteManyLessons.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })

      .addCase(deleteManyLessons.fulfilled, (state, action) => {
        state.loading.deleteMany = false;

        state.lastActionCode = action.payload.code;

        const ids = action.payload.deletedIds;

        if (ids?.length) {
          lessonsAdapter.removeMany(state, ids);

          state.lists.admin = state.lists.admin.filter(
            (id) => !ids.includes(id)
          );
          state.lists.public = state.lists.public.filter(
            (id) => !ids.includes(id)
          );
          state.lists.my = state.lists.my.filter((id) => !ids.includes(id));
        }
      })

      .addCase(deleteManyLessons.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(previewExportLessons.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportLessons.fulfilled, (state, action) => {
        state.previewLoading = false;

        state.lastActionCode = action.payload.code;

        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportLessons.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(exportLessons.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportLessons.fulfilled, (state) => {
        state.loading.export = false;

        state.lastActionCode = "LESSON_EXPORT_SUCCESS";
      })

      .addCase(exportLessons.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const { setCurrentLesson, setRecentlyUpdated, clearRecentlyUpdated } =
  lessonsSlice.actions;

export const {
  selectAll: selectAllLessons,
  selectById: selectLessonById,
  selectIds: selectLessonIds,
} = lessonsAdapter.getSelectors((state) => state.lessons);

// custom selectors
export const selectAdminLessons = (state) =>
  state.lessons.lists.admin
    .map((id) => state.lessons.entities[id])
    .filter(Boolean);

export const selectPublicLessons = (state) =>
  state.lessons.lists.public
    .map((id) => state.lessons.entities[id])
    .filter(Boolean);

export const selectMyLessons = (state) =>
  state.lessons.lists.my
    .map((id) => state.lessons.entities[id])
    .filter(Boolean);
export const makeSelectLessonOptionsByCourse = () =>
  createSelector(
    [selectAllLessons, (_, courseId) => courseId],
    (lessons, courseId) => {
      if (!courseId) return [];

      return lessons
        .filter((lesson) => {
          const cid = lesson.course?.id || lesson.course?._id || lesson.course;

          return String(cid) === String(courseId);
        })
        .map((lesson) => ({
          label: lesson.title,
          value: lesson.id,
        }));
    }
  );
export const selectLessonsByCourse = createSelector(
  [selectAllLessons, (_, courseId) => courseId],
  (lessons, courseId) => lessons.filter((l) => l.course?.id === courseId)
);
export const selectLessonLoading = (state) => state.lessons.loading;

export const selectAdminLessonLoading = (state) => state.lessons.loading.admin;
export const selectPublicLessonsLoading = (state) =>
  state.lessons.loading.public;

export const selectLessonDetailLoading = (state) =>
  state.lessons.loading.detail;

export default lessonsSlice.reducer;
