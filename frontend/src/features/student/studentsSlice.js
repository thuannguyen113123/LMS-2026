import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import {
  fetchStudents,
  fetchStudentDetail,
  createStudent,
  createManyStudents,
  updateStudent,
  fetchStudentStats,
  deleteManyStudents,
  previewExportStudents,
  exportStudents,
  fetchPublicStudents,
  toggleBookmark,
  fetchBookmarks,
  removeInstructorRating,
  rateInstructor,
} from "./studentsThunks";

const studentsAdapter = createEntityAdapter({
  selectId: (s) => s.id,
});

const initialState = studentsAdapter.getInitialState({
  currentStudent: null,
  stats: null,

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
    delete: false,
    deleteMany: false,

    stats: false,

    export: false,

    toggleBookmark: false,
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
  bookmarks: [],
  paginationBookmarks: {
    nextCursor: null,
    hasMore: false,
  },
  bookmarkLoading: false,
  bookmarksLoaded: false,
});

const studentsSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    setCurrentStudent(state, action) {
      state.currentStudent = action.payload;
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

      .addCase(fetchStudents.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { students, pagination } = action.payload;

        studentsAdapter.upsertMany(state, students);

        state.lists.admin = students.map((s) => s.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchPublicStudents.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.loading.public = true;
        }
      })

      .addCase(fetchPublicStudents.fulfilled, (state, action) => {
        const { students, pagination } = action.payload;

        state.loading.public = false;

        studentsAdapter.upsertMany(state, students);

        if (action.meta.arg?.isLoadMore) {
          const newIds = students.map((s) => s.id);

          if (action.meta.arg?.isLoadMore) {
            const existing = new Set(state.lists.public);

            state.lists.public.push(
              ...newIds.filter((id) => !existing.has(id))
            );
          } else {
            state.lists.public = newIds;
          }
        } else {
          state.lists.public = students.map((s) => s.id);
        }

        state.paginationPublic.nextCursor = pagination?.nextCursor || null;
        state.paginationPublic.hasMore = pagination?.hasNext ?? false;
      })

      .addCase(fetchPublicStudents.rejected, (state, action) => {
        state.loading.public = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchStudentDetail.fulfilled, (state, action) => {
        state.currentStudent = action.payload;
        state.loading.detail = false;
      })

      .addCase(createStudent.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })

      .addCase(createStudent.fulfilled, (state, action) => {
        state.loading.create = false;

        const student = action.payload.student;

        studentsAdapter.addOne(state, student);

        state.lists.admin.unshift(student.id);
        state.recentlyUpdatedIds.push(student.id);
      })

      .addCase(createStudent.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code || "SERVER_ERROR";
      })

      .addCase(createManyStudents.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })

      .addCase(createManyStudents.fulfilled, (state, action) => {
        state.loading.createMany = false;

        if (action.payload.created?.length) {
          studentsAdapter.addMany(state, action.payload.created);

          const ids = action.payload.created.map((s) => s.id);

          state.lists.admin.unshift(...ids);

          // highlight rows mới
          state.recentlyUpdatedIds.push(...ids);
        }

        state.lastBulkSummary = action.payload.summary;
      })

      .addCase(createManyStudents.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(updateStudent.pending, (state) => {
        state.loading.update = true;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.loading.update = false;
        const student = action.payload;

        studentsAdapter.updateOne(state, {
          id: student.id,
          changes: student,
        });

        state.recentlyUpdatedIds.push(student.id);
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.loading.update = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(fetchStudentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.loading.stats = false;
      })

      .addCase(deleteManyStudents.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })

      .addCase(deleteManyStudents.fulfilled, (state, action) => {
        const ids = action.payload.deletedIds;

        studentsAdapter.removeMany(state, ids);

        Object.keys(state.lists).forEach((key) => {
          state.lists[key] = state.lists[key].filter((id) => !ids.includes(id));
        });
        state.loading.deleteMany = false;
      })

      .addCase(deleteManyStudents.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(previewExportStudents.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportStudents.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportStudents.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      // ===== EXPORT STUDENTS =====
      .addCase(exportStudents.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportStudents.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "STUDENT_EXPORT_SUCCESS";
      })

      .addCase(exportStudents.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchBookmarks.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.bookmarkLoading = true;
        }
      })

      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        const { bookmarks, pagination } = action.payload;

        state.bookmarkLoading = false;
        state.bookmarks = [...action.payload.bookmarks];

        if (state.currentStudent) {
          state.currentStudent.bookmarks = [...action.payload.bookmarks];
        }

        if (action.meta.arg?.isLoadMore) {
          // Lấy danh sách id của khóa học đang có
          const existingIds = new Set(state.bookmarks.map((b) => b.course?.id));

          // Chỉ thêm các khóa học mới chưa có id trùng
          state.bookmarks.push(
            ...bookmarks.filter((b) => !existingIds.has(b.course?.id))
          );
        } else {
          state.bookmarks = bookmarks;
        }

        state.bookmarksLoaded = true;
        state.paginationBookmarks.nextCursor = pagination?.nextCursor || null;
        state.paginationBookmarks.hasMore = pagination?.hasNext ?? false;
      })

      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.bookmarkLoading = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(toggleBookmark.pending, (state) => {
        state.bookmarkLoading = true;
      })

      .addCase(toggleBookmark.fulfilled, (state, action) => {
        state.bookmarkLoading = false;

        state.bookmarks = action.payload.bookmarks;

        if (state.currentStudent) {
          state.currentStudent.bookmarks = action.payload.bookmarks;
        }
      })

      .addCase(toggleBookmark.rejected, (state) => {
        state.bookmarkLoading = false;
      })
      .addCase(rateInstructor.fulfilled, (state, action) => {
        const { instructorId, rating } = action.payload;

        if (!state.currentStudent) return;

        if (!state.currentStudent.instructorRatings) {
          state.currentStudent.instructorRatings = [];
        }

        const existing = state.currentStudent.instructorRatings.find((r) => {
          const id =
            typeof r.instructor === "string"
              ? r.instructor
              : r.instructor?.id || r.instructor?._id;

          return id === instructorId;
        });

        if (existing) {
          existing.rating = rating;
        } else {
          state.currentStudent.instructorRatings.push({
            instructor: instructorId,
            rating,
            createdAt: new Date().toISOString(),
          });
        }
      })

      .addCase(removeInstructorRating.fulfilled, (state, action) => {
        const { instructorId } = action.payload;

        if (!state.currentStudent?.instructorRatings) return;

        state.currentStudent.instructorRatings =
          state.currentStudent.instructorRatings.filter((r) => {
            const id =
              typeof r.instructor === "string"
                ? r.instructor
                : r.instructor?.id || r.instructor?._id;

            return id !== instructorId;
          });
      });
  },
});

export const {
  setCurrentStudent,
  resetPagination,
  setRecentlyUpdated,
  clearRecentlyUpdated,
} = studentsSlice.actions;
export default studentsSlice.reducer;

export const {
  selectAll: selectAllStudents,
  selectById: selectStudentById,
  selectIds: selectStudentIds,
} = studentsAdapter.getSelectors((state) => state.students);

export const selectAdminStudents = (state) =>
  state.students.lists.admin
    .map((id) => state.students.entities[id])
    .filter(Boolean);

export const selectPublicStudents = (state) =>
  state.students.lists.public
    .map((id) => state.students.entities[id])
    .filter(Boolean);
export const selectIsBookmarked = (courseId) => (state) =>
  state.students.bookmarks.some(
    (b) => (typeof b.course === "string" ? b.course : b.course?.id) === courseId
  );
export const selectStudentLoading = (state) => state.students.loading;
export const selectAdminStudentsLoading = (state) =>
  state.students.loading.admin;

export const selectPublicStudentsLoading = (state) =>
  state.students.loading.public;

export const selectStudentDetailLoading = (state) =>
  state.students.loading.detail;

export const selectCreateStudentLoading = (state) =>
  state.students.loading.create;

export const selectUpdateStudentLoading = (state) =>
  state.students.loading.update;

export const selectDeleteManyStudentsLoading = (state) =>
  state.students.loading.deleteMany;

export const selectStudentExportLoading = (state) =>
  state.students.loading.export;

export const selectBookmarksLoading = (state) =>
  state.students.loading.bookmarks;
