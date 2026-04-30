import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  createCourse,
  createManyCourses,
  deleteManyCourses,
  exportCourses,
  fetchCourseDetailBySlug,
  fetchCourseOptions,
  fetchCourses,
  fetchMyCourses,
  fetchPublicCourses,
  fetchRecommendedCourses,
  getContinueLearning,
  previewExportCourses,
  publishCourse,
  purchaseCourse,
  updateCourse,
} from "./coursesThunks";

export const coursesAdapter = createEntityAdapter({
  selectId: (course) => course.id,
});

const initialState = coursesAdapter.getInitialState({
  currentCourse: null,
  courseMap: {},
  currentSlug: null,

  lists: {
    admin: [],
    teaching: [],
    public: [],
    recommended: [],
    continueLearning: [],
    myCourses: [],
  },

  loading: {
    admin: false,
    publicList: false,
    publicLoadMore: false,
    detail: false,
    create: false,
    createMany: false,
    update: false,
    delete: false,
    publish: false,
    export: false,
  },
  error: null,
  errorCode: null,

  lastActionCode: null,
  lastBulkSummary: null,
  options: [],
  optionsLoading: false,

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
  },
  recentlyUpdatedIds: [],
  recommendedLoading: false,

  paginationMyCourses: {
    nextCursor: null,
    hasNext: false,
  },

  myCoursesLoading: false,
});

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    setCurrentCourse(state, action) {
      state.currentCourse = action.payload;
    },

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
      // FETCH
      .addCase(fetchCourses.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { courses, pagination } = action.payload;

        coursesAdapter.upsertMany(state, courses);

        state.lists.admin = courses.map((c) => c.id);
        state.lists.teaching = courses.map((c) => c.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      // ✅ fetch course detail theo slug
      .addCase(fetchCourseDetailBySlug.pending, (state) => {
        state.loading.detail = true;
        state.errorCode = null;
      })
      .addCase(fetchCourseDetailBySlug.fulfilled, (state, action) => {
        state.loading.detail = false;
        const course = action.payload.course;
        if (course) {
          // lưu vào map theo slug
          state.courseMap[course.slug] = course;
          state.currentSlug = course.slug;

          // optional: lưu cache vào adapter
          coursesAdapter.upsertOne(state, course);
        }
      })
      .addCase(fetchCourseDetailBySlug.rejected, (state, action) => {
        state.loading.detail = false;
        state.errorCode = action.payload?.code || "COURSE_DETAIL_FAILED";
      })

      .addCase(fetchPublicCourses.pending, (state, action) => {
        if (action.meta.arg?.isLoadMore) {
          state.loading.publicLoadMore = true;
        } else {
          state.loading.publicList = true;

          //  FIX QUAN TRỌNG
          state.lists.public = [];
          state.paginationPublic.nextCursor = null;
          state.paginationPublic.hasMore = false;

          // optional (nếu muốn clear luôn entity)
          coursesAdapter.removeAll(state);
        }
      })

      .addCase(fetchPublicCourses.fulfilled, (state, action) => {
        const { courses, pagination } = action.payload;

        if (action.meta.arg?.isLoadMore) {
          state.loading.publicLoadMore = false;
        } else {
          state.loading.publicList = false;
        }

        coursesAdapter.upsertMany(state, courses);

        if (action.meta.arg?.isLoadMore) {
          state.lists.public.push(...courses.map((c) => c.id));
        } else {
          state.lists.public = courses.map((c) => c.id);
        }

        state.paginationPublic.nextCursor = pagination?.nextCursor || null;
        state.paginationPublic.hasMore = pagination?.hasMore ?? false;
      })

      .addCase(fetchPublicCourses.rejected, (state, action) => {
        if (action.meta.arg?.isLoadMore) {
          state.loading.publicLoadMore = false;
        } else {
          state.loading.publicList = false;
        }

        state.errorCode = action.payload?.code;
      })
      .addCase(fetchCourseOptions.pending, (state) => {
        state.optionsLoading = true;
      })

      .addCase(fetchCourseOptions.fulfilled, (state, action) => {
        state.optionsLoading = false;

        state.options = action.payload;
      })

      .addCase(fetchCourseOptions.rejected, (state, action) => {
        state.optionsLoading = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchMyCourses.pending, (state, action) => {
        if (!action.meta.arg?.cursor) {
          state.myCoursesLoading = true;
        }
      })

      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.myCoursesLoading = false;

        const { courses, pagination, isLoadMore, reset } = action.payload;

        coursesAdapter.upsertMany(state, courses);

        const ids = courses.map((c) => c.id);

        if (reset) {
          state.lists.myCourses = ids; // ✅ replace
        } else if (isLoadMore) {
          state.lists.myCourses.push(...ids);
        } else {
          state.lists.myCourses = ids;
        }

        state.paginationMyCourses.nextCursor = pagination?.nextCursor || null;
        state.paginationMyCourses.hasNext = pagination?.hasNext ?? false;
      })

      .addCase(fetchMyCourses.rejected, (state) => {
        state.myCoursesLoading = false;
      })
      .addCase(fetchRecommendedCourses.pending, (state) => {
        state.recommendedLoading = true;
      })
      .addCase(fetchRecommendedCourses.fulfilled, (state, action) => {
        state.recommendedLoading = false;
        const courses = action.payload;
        coursesAdapter.upsertMany(state, courses);
        state.lists.recommended = courses.map((c) => c.id);
      })
      .addCase(fetchRecommendedCourses.rejected, (state, action) => {
        state.recommendedLoading = false;
        state.error = action.payload;
      })

      .addCase(getContinueLearning.pending, (state) => {
        state.loading.continueLearning = true;
        state.errorCode = null;
      })

      .addCase(getContinueLearning.fulfilled, (state, action) => {
        state.loading.continueLearning = false;

        const courses = action.payload.courses;

        coursesAdapter.upsertMany(state, courses);

        state.lists.continueLearning = courses.map((c) => c.id);
      })

      .addCase(getContinueLearning.rejected, (state, action) => {
        state.loading.continueLearning = false;
        state.errorCode = action.payload?.code || "SERVER_ERROR";
      })
      .addCase(createCourse.pending, (state) => {
        state.loading.create = true;
      })
      // CREATE
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading.create = false;

        const course = action.payload.course;

        coursesAdapter.addOne(state, course);

        state.lists.admin.unshift(course.id);
        state.recentlyUpdatedIds.push(course.id);
      })
      .addCase(createCourse.rejected, (state) => {
        state.loading.create = false;
      })

      // ===== BULK CREATE COURSES =====
      .addCase(createManyCourses.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })

      .addCase(createManyCourses.fulfilled, (state, action) => {
        state.loading.createMany = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.created?.length) {
          coursesAdapter.addMany(state, action.payload.created);

          const createdIds = action.payload.created.map((c) => c.id);

          state.lists.admin.unshift(...createdIds);

          // highlight row mới
          state.recentlyUpdatedIds.push(...createdIds);
        }

        state.lastBulkSummary = action.payload.summary;
      })

      .addCase(createManyCourses.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(publishCourse.pending, (state) => {
        state.loading.publish = true;
        state.errorCode = null;
      })

      .addCase(publishCourse.fulfilled, (state, action) => {
        state.loading.publish = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.course) {
          coursesAdapter.upsertOne(state, action.payload.course);
        }
      })

      .addCase(publishCourse.rejected, (state, action) => {
        state.loading.publish = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(updateCourse.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading.update = false;
        const course = action.payload.course;
        coursesAdapter.updateOne(state, {
          id: action.payload.course.id,
          changes: action.payload.course,
        });
        state.recentlyUpdatedIds.push(course.id);
      })

      .addCase(updateCourse.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload?.code || action.error.message;
      })

      .addCase(deleteManyCourses.pending, (state) => {
        state.loading.delete = true;
        state.errorCode = null;
      })

      .addCase(deleteManyCourses.fulfilled, (state, action) => {
        state.loading.delete = false;

        const ids = action.payload.deletedIds;

        coursesAdapter.removeMany(state, ids);

        Object.keys(state.lists).forEach((key) => {
          state.lists[key] = state.lists[key].filter((id) => !ids.includes(id));
        });
      })

      .addCase(deleteManyCourses.rejected, (state, action) => {
        state.loading.delete = false;
        state.errorCode = action.payload?.code;
      })
      // ===== PREVIEW EXPORT COURSES =====
      .addCase(previewExportCourses.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportCourses.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportCourses.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      // ===== EXPORT COURSES =====
      .addCase(exportCourses.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportCourses.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "COURSE_EXPORT_SUCCESS";
      })

      .addCase(exportCourses.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(purchaseCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(purchaseCourse.fulfilled, (state, action) => {
        state.loading = false;
        const { courseId } = action.payload;
        const existing = state.entities[courseId];
        if (existing) {
          existing.purchased = true;
        }
      })
      .addCase(purchaseCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  setCurrentCourse,
  resetPagination,
  setRecentlyUpdated,
  clearRecentlyUpdated,
} = coursesSlice.actions;

export const {
  selectAll: selectAllCourses,
  selectById: selectCourseById,
  selectIds: selectCourseIds,
} = coursesAdapter.getSelectors((state) => state.courses);

export const selectCourseBySlug = (slug) =>
  createSelector(
    (state) => state.courses.courseMap,
    (courseMap) => courseMap[slug]
  );

export const selectAdminCourses = createSelector(
  [(state) => state.courses.lists.admin, (state) => state.courses.entities],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);

export const selectPublicCourses = createSelector(
  [(state) => state.courses.lists.public, (state) => state.courses.entities],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);

export const selectRecommendedCourses = createSelector(
  [
    (state) => state.courses.lists.recommended,
    (state) => state.courses.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);

export const selectContinueLearningCourses = createSelector(
  [
    (state) => state.courses.lists.continueLearning,
    (state) => state.courses.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id])
);
export const selectCourseOptions = createSelector(
  (state) => state.courses.options,
  (options) =>
    options.map((c) => ({
      label: c.name,
      value: c.id,
      slug: c.slug,
    }))
);

export const selectCourseOptionsLoading = (state) =>
  state.courses.optionsLoading;
export const selectMyCourses = (state) =>
  state.courses.lists.myCourses
    .map((id) => state.courses.entities[id])
    .filter(Boolean);

export const selectMyCoursesPagination = (state) =>
  state.courses.paginationMyCourses;
export const selectCourseLoading = (state) => state.courses.loading;

export const selectAdminLoading = (state) => state.courses.loading.admin;

export const selectCourseDetailLoading = (state) =>
  state.courses.loading.detail;

export const selectMyCoursesLoading = (state) => state.courses.myCoursesLoading;

export const selectCoursesForLesson = (state) =>
  state.courses.lists.teaching
    .map((id) => state.courses.entities[id])
    .filter(Boolean);

export const selectLessonCourseOptions = createSelector(
  [selectCoursesForLesson],
  (courses) =>
    courses.map((c) => ({
      label: c.title,
      value: c.id,
      slug: c.slug,
    }))
);

export default coursesSlice.reducer;
