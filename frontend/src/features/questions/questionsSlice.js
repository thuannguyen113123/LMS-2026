import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import {
  fetchQuestions,
  fetchQuestionDetail,
  createQuestion,
  createManyQuestions,
  updateQuestion,
  deleteManyQuestions,
  fetchQuestionsByQuiz,
  previewExportQuestions,
  exportQuestions,
  fetchPublicQuestions,
} from "./questionsThunks";

const questionsAdapter = createEntityAdapter({
  selectId: (q) => q.id,
});

const initialState = questionsAdapter.getInitialState({
  currentQuestion: null,

  lists: {
    admin: [],
    public: [],
  },

  loading: {
    admin: false,
    public: false,
    byQuiz: false,
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

const questionsSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    setCurrentQuestion(state, action) {
      state.currentQuestion = action.payload;
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

      // FETCH QUESTIONS
      .addCase(fetchQuestions.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { questions, pagination } = action.payload;

        questionsAdapter.upsertMany(state, questions);

        state.lists.admin = questions.map((q) => q.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchPublicQuestions.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.loading.public = true;
        }
      })

      .addCase(fetchPublicQuestions.fulfilled, (state, action) => {
        const { questions, pagination } = action.payload;

        state.loading.public = false;

        questionsAdapter.upsertMany(state, questions);

        if (action.meta.arg?.isLoadMore) {
          state.lists.public.push(...questions.map((q) => q.id));
        } else {
          state.lists.public = questions.map((q) => q.id);
        }

        state.paginationPublic.nextCursor = pagination?.nextCursor || null;
        state.paginationPublic.hasMore = pagination?.hasNext ?? false;
      })

      .addCase(fetchPublicQuestions.rejected, (state, action) => {
        state.loading.public = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchQuestionsByQuiz.pending, (state) => {
        state.loading.byQuiz = true;
        state.error = null;
      })

      .addCase(fetchQuestionsByQuiz.fulfilled, (state, action) => {
        state.loading.byQuiz = false;
        questionsAdapter.setAll(state, action.payload.data);
      })

      .addCase(fetchQuestionsByQuiz.rejected, (state, action) => {
        state.loading.byQuiz = false;
        state.error = action.payload;
      })
      // 📘 FETCH DETAIL
      .addCase(fetchQuestionDetail.pending, (state) => {
        state.loading.detail = true;
      })
      .addCase(fetchQuestionDetail.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.currentQuestion = action.payload;
      })
      .addCase(fetchQuestionDetail.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload;
      })

      // 🆕 CREATE
      .addCase(createQuestion.pending, (state) => {
        state.loading.create = true;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading.create = false;

        const question = action.payload;

        questionsAdapter.addOne(state, question);

        state.lists.admin.unshift(question.id);

        // ⭐ highlight row mới
        state.recentlyUpdatedIds.push(question.id);
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload;
      })

      // 🧩 CREATE MANY
      .addCase(createManyQuestions.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })

      .addCase(createManyQuestions.fulfilled, (state, action) => {
        state.loading.createMany = false;
        state.lastActionCode = action.payload.code;

        const created = action.payload.created || [];

        if (created.length) {
          questionsAdapter.addMany(state, created);

          const ids = created.map((q) => q.id);

          state.lists.admin.unshift(...ids);

          // ⭐ highlight bulk
          state.recentlyUpdatedIds.push(...ids);
        }

        state.lastBulkSummary = action.payload.summary;
      })

      .addCase(createManyQuestions.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      // 🔁 UPDATE
      .addCase(updateQuestion.pending, (state) => {
        state.loading.update = true;
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.loading.update = false;

        const question = action.payload;

        questionsAdapter.updateOne(state, {
          id: question.id,
          changes: question,
        });

        // ⭐ highlight updated row
        state.recentlyUpdatedIds.push(question.id);
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload;
      })

      .addCase(deleteManyQuestions.pending, (state) => {
        state.loading.deleteMany = true;
      })
      //  DELETE MANY
      .addCase(deleteManyQuestions.fulfilled, (state, action) => {
        state.loading.deleteMany = false;
        const ids = action.payload;

        questionsAdapter.removeMany(state, ids);

        Object.keys(state.lists).forEach((key) => {
          state.lists[key] = state.lists[key].filter((id) => !ids.includes(id));
        });
      })

      .addCase(deleteManyQuestions.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.error = action.payload;
      })
      // ===== PREVIEW EXPORT QUESTIONS =====
      .addCase(previewExportQuestions.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportQuestions.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportQuestions.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      // ===== EXPORT QUESTIONS =====
      .addCase(exportQuestions.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportQuestions.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "QUESTION_EXPORT_SUCCESS";
      })

      .addCase(exportQuestions.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const { setCurrentQuestion, setRecentlyUpdated, clearRecentlyUpdated } =
  questionsSlice.actions;
export default questionsSlice.reducer;

//  Selectors
export const {
  selectAll: selectAllQuestions,
  selectById: selectQuestionById,
  selectIds: selectQuestionIds,
} = questionsAdapter.getSelectors((state) => state.questions);

export const selectAdminQuestions = (state) =>
  state.questions.lists.admin
    .map((id) => state.questions.entities[id])
    .filter(Boolean);
export const selectPublicQuestions = (state) =>
  state.questions.lists.public
    .map((id) => state.questions.entities[id])
    .filter(Boolean);
export const selectQuestionLoading = (state) => state.questions.loading;

export const selectAdminQuestionsLoading = (state) =>
  state.questions.loading.admin;

export const selectPublicQuestionsLoading = (state) =>
  state.questions.loading.public;

export const selectQuestionDetailLoading = (state) =>
  state.questions.loading.detail;

export const selectQuestionsByQuizLoading = (state) =>
  state.questions.loading.byQuiz;
export const selectExportQuestionsLoading = (state) =>
  state.questions.loading.export;
