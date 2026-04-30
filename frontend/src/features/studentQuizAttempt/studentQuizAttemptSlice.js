import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import {
  fetchStudentQuizAttempts,
  startStudentQuizAttempt,
  submitStudentQuizAttempt,
  deleteStudentQuizAttempt,
  fetchStudentQuizAttemptDetailById,
  fetchAttemptAnswers,
} from "./studentQuizAttemptThunks";

const studentQuizAttemptAdapter = createEntityAdapter({
  selectId: (a) => a._id || a.id,
});

const initialState = studentQuizAttemptAdapter.getInitialState({
  currentAttempt: null,
  loading: {
    admin: false,
    detail: false,
    start: false,
    submit: false,
    deleteMany: false,
  },

  error: null,

  errorCode: null,
  lastActionCode: null,
  lists: {
    admin: [],
  },

  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  answersByAttempt: {},

  answersLoading: false,
  detailModal: {
    isOpen: false,
    attemptId: null,
  },
});

const studentQuizAttemptSlice = createSlice({
  name: "studentQuizAttempt",
  initialState,
  reducers: {
    setCurrentAttempt(state, action) {
      state.currentAttempt = action.payload;
    },
    goToPrevPage(state) {
      if (state.prevPageTokens.length > 0) {
        state.prevPageTokens.pop();
        state.page -= 1;
      }
    },
    openAttemptDetailModal(state, action) {
      state.detailModal.isOpen = true;
      state.detailModal.attemptId = action.payload;
    },

    /** ⭐ CLOSE DETAIL */
    closeAttemptDetailModal(state) {
      state.detailModal.isOpen = false;
      state.detailModal.attemptId = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchStudentQuizAttempts.pending, (state) => {
        state.loading.admin = true;
        state.errorCode = null;
      })

      .addCase(fetchStudentQuizAttempts.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { attempts, pagination } = action.payload;

        // cache vào entity
        studentQuizAttemptAdapter.upsertMany(state, attempts);

        // list hiển thị admin
        state.lists.admin = attempts.map((a) => a.id);

        // pagination
        state.pagination = pagination;
      })

      .addCase(fetchStudentQuizAttempts.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(startStudentQuizAttempt.pending, (state) => {
        state.loading.start = true;
        state.errorCode = null;
      })

      .addCase(startStudentQuizAttempt.fulfilled, (state, action) => {
        state.loading.start = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.attempt) {
          studentQuizAttemptAdapter.addOne(state, action.payload.attempt);
          state.currentAttempt = action.payload.attempt;
        }
      })

      .addCase(startStudentQuizAttempt.rejected, (state, action) => {
        state.loading.start = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchStudentQuizAttemptDetailById.pending, (state) => {
        state.loading.detail = true;
      })
      .addCase(fetchStudentQuizAttemptDetailById.fulfilled, (state, action) => {
        state.loading.detail = false;

        // 🔥 CỰC KỲ QUAN TRỌNG
        state.currentAttempt = action.payload;

        // optional: sync vào adapter nếu muốn
        studentQuizAttemptAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchStudentQuizAttemptDetailById.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(submitStudentQuizAttempt.pending, (state) => {
        state.loading.submit = true;
      })
      .addCase(submitStudentQuizAttempt.fulfilled, (state, action) => {
        state.loading.submit = false;
        studentQuizAttemptAdapter.upsertOne(state, action.payload);
        state.currentAttempt = action.payload;
      })
      .addCase(submitStudentQuizAttempt.rejected, (state, action) => {
        state.loading.submit = false;
        state.error = action.payload;
      })
      .addCase(fetchAttemptAnswers.pending, (state) => {
        state.answersLoading = true;
      })

      .addCase(fetchAttemptAnswers.fulfilled, (state, action) => {
        state.answersLoading = false;

        const { attemptId, answers, pagination } = action.payload;

        if (!state.answersByAttempt[attemptId]) {
          state.answersByAttempt[attemptId] = {
            ids: [],
            entities: {},
            nextCursor: null,
            hasNext: true,
          };
        }

        const bucket = state.answersByAttempt[attemptId];

        answers.forEach((a) => {
          const id = a.id || a._id;

          if (!bucket.entities[id]) {
            bucket.ids.push(id);
          }

          bucket.entities[id] = a;
        });

        bucket.nextCursor = pagination.nextCursor;
        bucket.hasNext = pagination.hasNext;
      })

      .addCase(fetchAttemptAnswers.rejected, (state) => {
        state.answersLoading = false;
      })

      .addCase(deleteStudentQuizAttempt.fulfilled, (state, action) => {
        studentQuizAttemptAdapter.removeOne(state, action.payload);
      });
  },
});

export const {
  setCurrentAttempt,
  goToPrevPage,
  openAttemptDetailModal,
  closeAttemptDetailModal,
} = studentQuizAttemptSlice.actions;

export default studentQuizAttemptSlice.reducer;

export const {
  selectAll: selectAllStudentQuizAttempts,
  selectById: selectStudentQuizAttemptById,
  selectIds: selectStudentQuizAttemptIds,
} = studentQuizAttemptAdapter.getSelectors((state) => state.studentQuizAttempt);
export const selectAttemptList = (state) =>
  state.studentQuizAttempt.ids.map(
    (id) => state.studentQuizAttempt.entities[id]
  );
export const selectAdminStudentQuizAttempts = (state) =>
  state.studentQuizAttempt.lists.admin
    .map((id) => state.studentQuizAttempt.entities[id])
    .filter(Boolean);
export const selectStudentQuizAttemptLoading = (state) =>
  state.studentQuizAttempt.loading;

export const selectAttemptListLoading = (state) =>
  state.studentQuizAttempt.loading.admin;

export const selectAttemptDetailLoading = (state) =>
  state.studentQuizAttempt.loading.detail;

export const selectStartAttemptLoading = (state) =>
  state.studentQuizAttempt.loading.start;

export const selectSubmitAttemptLoading = (state) =>
  state.studentQuizAttempt.loading.submit;
