import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchQuizzes,
  fetchQuizDetail,
  createQuiz,
  createManyQuizzes,
  updateQuiz,
  deleteManyQuizzes,
  exportQuizzes,
  previewExportQuizzes,
  fetchPublicQuizzes,
  fetchMyQuizzes,
  fetchQuizOptions,
} from "./quizzesThunks";

const quizzesAdapter = createEntityAdapter({
  selectId: (quiz) => quiz.id || quiz._id,
  sortComparer: (a, b) => (a.title ?? "").localeCompare(b.title ?? ""),
});

const initialState = quizzesAdapter.getInitialState({
  currentQuiz: null,

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
    hasNext: false,
  },
  paginationMy: {
    nextCursor: null,
    hasNext: false,
  },
  recentlyUpdatedIds: [],
});

const quizzesSlice = createSlice({
  name: "quizzes",
  initialState,
  reducers: {
    setCurrentQuiz(state, action) {
      state.currentQuiz = action.payload;
    },
    setRecentlyUpdated: (state, action) => {
      const id = action.payload;

      if (!state.recentlyUpdatedIds.includes(id)) {
        state.recentlyUpdatedIds.push(id);
      }
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
      .addCase(fetchQuizzes.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { quizzes, pagination } = action.payload;

        quizzesAdapter.upsertMany(state, quizzes);

        state.lists.admin = quizzes.map((q) => q.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchPublicQuizzes.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.loading.public = true;
        }
      })

      .addCase(fetchPublicQuizzes.fulfilled, (state, action) => {
        const { quizzes, pagination } = action.payload;

        state.loading.public = false;

        quizzesAdapter.upsertMany(state, quizzes);

        if (action.meta.arg?.isLoadMore) {
          state.lists.public.push(...quizzes.map((q) => q.id));
        } else {
          state.lists.public = quizzes.map((q) => q.id);
        }

        state.paginationPublic.nextCursor = pagination?.nextCursor || null;
        state.paginationPublic.hasNext = pagination?.hasNext || false;
      })

      .addCase(fetchPublicQuizzes.rejected, (state, action) => {
        state.loading.public = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchMyQuizzes.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.loading.my = true;
        }
      })

      .addCase(fetchMyQuizzes.fulfilled, (state, action) => {
        state.loading.my = false;

        const { quizzes } = action.payload;
        const { data, pagination } = quizzes;

        quizzesAdapter.upsertMany(state, data);

        if (action.meta.arg?.isLoadMore) {
          state.lists.my.push(...data.map((q) => q.id));
        } else {
          state.lists.my = data.map((q) => q.id);
        }

        state.paginationMy.nextCursor = pagination?.nextCursor || null;
        state.paginationMy.hasNext = pagination?.hasNext || false;
      })

      .addCase(fetchMyQuizzes.rejected, (state, action) => {
        state.loading.my = false;
        state.errorCode = action.payload?.code;
      })

      // FETCH DETAIL
      .addCase(fetchQuizDetail.pending, (state) => {
        state.loading.detail = true;
      })
      .addCase(fetchQuizDetail.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentQuiz = action.payload;
      })
      .addCase(fetchQuizDetail.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload;
      })

      // CREATE
      .addCase(createQuiz.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createQuiz.fulfilled, (state, action) => {
        state.loading.create = false;

        const quiz = action.payload.quiz;

        quizzesAdapter.addOne(state, quiz);

        state.lists.admin.unshift(quiz.id);
        state.recentlyUpdatedIds.push(quiz.id);

        state.lastActionCode = action.payload.code;
      })

      .addCase(createQuiz.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code || "SERVER_ERROR";
      })

      // CREATE MANY
      .addCase(createManyQuizzes.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })

      .addCase(createManyQuizzes.fulfilled, (state, action) => {
        state.loading.createMany = false;

        const quizzes = action.payload.created || [];

        quizzesAdapter.addMany(state, quizzes);

        const createdIds = quizzes.map((q) => q.id);

        state.lists.admin.unshift(...createdIds);

        // ⭐ highlight rows
        state.recentlyUpdatedIds.push(...createdIds);

        state.lastActionCode = action.payload.code;
        state.lastBulkSummary = action.payload.summary;
      })
      .addCase(createManyQuizzes.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      // UPDATE
      .addCase(updateQuiz.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })

      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.loading.update = false;

        const quiz = action.payload.quiz;

        quizzesAdapter.updateOne(state, {
          id: quiz.id,
          changes: quiz,
        });

        state.recentlyUpdatedIds.push(quiz.id);
      })

      .addCase(updateQuiz.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload?.code || action.error.message;
      })

      // DELETE MANY
      .addCase(deleteManyQuizzes.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })

      .addCase(deleteManyQuizzes.fulfilled, (state, action) => {
        state.loading.deleteMany = false;

        const ids = action.payload.deletedIds;

        quizzesAdapter.removeMany(state, ids);

        Object.keys(state.lists).forEach((k) => {
          state.lists[k] = state.lists[k].filter((id) => !ids.includes(id));
        });

        state.lastActionCode = action.payload.code;
      })

      .addCase(deleteManyQuizzes.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(previewExportQuizzes.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportQuizzes.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportQuizzes.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      // ===== EXPORT QUIZZES =====
      .addCase(exportQuizzes.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportQuizzes.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "QUIZ_EXPORT_SUCCESS";
      })

      .addCase(exportQuizzes.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchQuizOptions.pending, (state) => {
        state.optionsLoading = true;
      })

      .addCase(fetchQuizOptions.fulfilled, (state, action) => {
        state.optionsLoading = false;
        state.options = action.payload;
      })

      .addCase(fetchQuizOptions.rejected, (state, action) => {
        state.optionsLoading = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const selectQuizzesByScope = (state, { lessonId, courseSlug }) => {
  const list = selectPublicQuizzes(state);

  if (lessonId) {
    return list.filter((q) => q.lesson === lessonId);
  }

  if (courseSlug) {
    return list.filter((q) => q.course?.slug === courseSlug);
  }

  return [];
};
export const { setCurrentQuiz, setRecentlyUpdated, clearRecentlyUpdated } =
  quizzesSlice.actions;
export default quizzesSlice.reducer;

// 🧭 Selectors
export const {
  selectAll: selectAllQuizzes,
  selectById: selectQuizById,
  selectIds: selectQuizIds,
} = quizzesAdapter.getSelectors((state) => state.quizzes);
export const selectAdminQuizzes = (state) =>
  state.quizzes.lists.admin
    .map((id) => state.quizzes.entities[id])
    .filter(Boolean);
export const selectPublicQuizzes = (state) =>
  state.quizzes.lists.public
    .map((id) => state.quizzes.entities[id])
    .filter(Boolean);
export const selectMyQuizzes = (state) =>
  state.quizzes.lists.my
    .map((id) => state.quizzes.entities[id])
    .filter(Boolean);
export const selectQuizOptions = createSelector(
  (state) => state.quizzes.options,
  (options) =>
    options.map((q) => ({
      label: q.name,
      value: q.id,
      slug: q.slug,
    }))
);
export const selectQuizOptionsLoading = (state) => state.quizzes.optionsLoading;
export const selectMyQuizzesByStatus = (status) => (state) =>
  selectMyQuizzes(state).filter((q) => q.status === status);

export const selectQuizLoading = (state) => state.quizzes.loading;

export const selectAdminQuizzesLoading = (state) => state.quizzes.loading.admin;

export const selectPublicQuizzesLoading = (state) =>
  state.quizzes.loading.public;

export const selectMyQuizzesLoading = (state) => state.quizzes.loading.my;

export const selectQuizDetailLoading = (state) => state.quizzes.loading.detail;
export const selectQuizExportLoading = (state) => state.quizzes.loading.export;
