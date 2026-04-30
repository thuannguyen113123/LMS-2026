import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import {
  getOrCreateLessonProgress,
  fetchLessonProgressByCourse,
  updateLessonWatching,
  completeLesson,
  submitLessonQuiz,
  fetchLessonProgressList,
  fetchLessonProgressDetail,
  resetLessonProgressById,
} from "./lessonProgressThunks";

/* =====================================================
     ADAPTER
  ===================================================== */
const lessonProgressAdapter = createEntityAdapter({
  selectId: (progress) => progress.id,
});

/* =====================================================
     INITIAL STATE
  ===================================================== */
const initialState = lessonProgressAdapter.getInitialState({
  loading: {
    list: false,
    getOrCreate: false,
    watching: false,
    reset: false,
    quizSubmit: false,
    courseProgress: false,
  },
  error: null,
  currentLessonId: null, // UI đang học bài nào
  errorCode: null,
  lastActionCode: null,
  lists: {
    main: [],
  },

  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  detail: null,
  detailLoading: false,
  detailError: null,
});

const lessonProgressSlice = createSlice({
  name: "lessonProgress",
  initialState,
  reducers: {
    setCurrentLesson(state, action) {
      state.currentLessonId = action.payload;
    },
    resetLessonProgress(state) {
      lessonProgressAdapter.removeAll(state);
      state.currentLessonId = null;
      state.error = null;
    },
    openProgressModal: (state) => {
      state.isDetailModalOpen = true;
    },
    closeProgressModal: (state) => {
      state.isDetailModalOpen = false;
      state.detail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------- GET OR CREATE ---------- */
      .addCase(getOrCreateLessonProgress.pending, (state) => {
        state.loading.getOrCreate = true;
        state.errorCode = null;
      })

      .addCase(getOrCreateLessonProgress.fulfilled, (state, action) => {
        state.loading.getOrCreate = false;
        state.lastActionCode = action.payload.code;

        const progress = action.payload.progress;

        if (progress) {
          lessonProgressAdapter.upsertOne(state, progress);
          state.currentLessonId = progress.lessonId;
        }
      })

      .addCase(getOrCreateLessonProgress.rejected, (state, action) => {
        state.loading.getOrCreate = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchLessonProgressList.pending, (state) => {
        state.loading.list = true;
        state.errorCode = null;
      })

      .addCase(fetchLessonProgressList.fulfilled, (state, action) => {
        state.loading.list = false;

        const { progresses, pagination, code } = action.payload;

        state.lastActionCode = code;

        lessonProgressAdapter.setAll(state, progresses);

        state.lists.main = progresses.map((p) => p.id);

        state.pagination = pagination;
      })

      .addCase(fetchLessonProgressList.rejected, (state, action) => {
        state.loading.list = false;
        state.errorCode = action.payload?.code;
      })
      /* ---------- FETCH DETAIL ---------- */

      .addCase(fetchLessonProgressDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })

      .addCase(fetchLessonProgressDetail.fulfilled, (state, action) => {
        state.detailLoading = false;

        const { detail, code } = action.payload;

        state.lastActionCode = code;
        state.detail = detail;
      })

      .addCase(fetchLessonProgressDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload?.code;
      })

      /* ---------- FETCH BY COURSE ---------- */
      .addCase(fetchLessonProgressByCourse.pending, (state) => {
        state.loading.courseProgress = true;
        state.errorCode = null;
      })

      .addCase(fetchLessonProgressByCourse.fulfilled, (state, action) => {
        state.loading.courseProgress = false;
        state.lastActionCode = action.payload.code;

        const progresses = action.payload.progresses;

        if (progresses?.length) {
          lessonProgressAdapter.upsertMany(state, progresses);
        }
      })

      .addCase(fetchLessonProgressByCourse.rejected, (state, action) => {
        state.loading.courseProgress = false;
        state.errorCode = action.payload?.code;
      })

      /* ---------- UPDATE WATCHING ---------- */
      .addCase(updateLessonWatching.pending, (state) => {
        state.loading.watching = true;
        state.errorCode = null;
      })

      .addCase(updateLessonWatching.fulfilled, (state, action) => {
        state.loading.watching = false;
        state.lastActionCode = action.payload.code;

        const progress = action.payload.progress;

        if (progress) {
          lessonProgressAdapter.upsertOne(state, progress);
        }
      })

      .addCase(updateLessonWatching.rejected, (state, action) => {
        state.loading.watching = false;
        state.errorCode = action.payload?.code;
      })

      /* ---------- COMPLETE LESSON ---------- */
      .addCase(completeLesson.fulfilled, (state, action) => {
        const progress = action.payload.progress;
        if (progress) {
          lessonProgressAdapter.upsertOne(state, progress);
        }
      })

      .addCase(submitLessonQuiz.pending, (state) => {
        state.loading.quizSubmit = true;
      })
      /* ---------- SUBMIT QUIZ ---------- */
      .addCase(submitLessonQuiz.fulfilled, (state, action) => {
        lessonProgressAdapter.upsertOne(state, action.payload);
      })
      .addCase(submitLessonQuiz.rejected, (state) => {
        state.loading.quizSubmit = false;
      })
      /* ---------- RESET PROGRESS ---------- */
      .addCase(resetLessonProgressById.pending, (state) => {
        state.loading.reset = true;
        state.errorCode = null;
      })

      .addCase(resetLessonProgressById.fulfilled, (state, action) => {
        state.loading.reset = false;
        state.lastActionCode = action.payload.code;

        const progress = action.payload.progress;

        if (!progress) return;

        // ✅ update entity adapter
        lessonProgressAdapter.upsertOne(state, progress);

        // ✅ update detail nếu đang mở modal
        if (state.detail) {
          const isSame = state.detail?.course?.id === progress.courseId;

          if (isSame) {
            state.detail = null;
            // hoặc dispatch fetchDetail lại nếu muốn realtime
          }
        }
      })

      .addCase(resetLessonProgressById.rejected, (state, action) => {
        state.loading.reset = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const {
  setCurrentLesson,
  resetLessonProgress,
  openProgressModal,
  closeProgressModal,
} = lessonProgressSlice.actions;

export default lessonProgressSlice.reducer;

export const {
  selectAll: selectAllLessonProgress,
  selectById: selectLessonProgressByLessonKey,
} = lessonProgressAdapter.getSelectors((state) => state.lessonProgress);
export const selectLessonProgressList = (state) =>
  state.lessonProgress.lists.main
    .map((id) => state.lessonProgress.entities[id])
    .filter(Boolean);
export const selectProgressByCourse = (courseId) =>
  createSelector([selectAllLessonProgress], (items) =>
    items.filter((p) => p.courseId === courseId)
  );

export const selectProgressByLesson = (lessonId) =>
  createSelector([selectAllLessonProgress], (items) =>
    items.find((p) => p.lessonId === lessonId)
  );
export const selectLessonProgressDetail = (state) =>
  state.lessonProgress.detail;

export const selectLessonProgressDetailLoading = (state) =>
  state.lessonProgress.detailLoading;
export const selectLessonProgressLoading = (state) =>
  state.lessonProgress.loading;

export const selectLessonProgressListLoading = (state) =>
  state.lessonProgress.loading.list;

export const selectGetOrCreateProgressLoading = (state) =>
  state.lessonProgress.loading.getOrCreate;

export const selectWatchingProgressLoading = (state) =>
  state.lessonProgress.loading.watching;

export const selectResetProgressLoading = (state) =>
  state.lessonProgress.loading.reset;

export const selectQuizSubmitLoading = (state) =>
  state.lessonProgress.loading.quizSubmit;

export const selectCourseProgressLoading = (state) =>
  state.lessonProgress.loading.courseProgress;
