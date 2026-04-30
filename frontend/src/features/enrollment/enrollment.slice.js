import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { enrollFreeCourse } from "./enrollment.thunk";

// Adapter cho các khóa học đã ghi danh
const enrollmentAdapter = createEntityAdapter({
  selectId: (item) => item.courseId,
});

const initialState = enrollmentAdapter.getInitialState({
  enrolling: false,
  error: null,
});

const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState,
  reducers: {
    resetEnrollmentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ENROLL FREE
      .addCase(enrollFreeCourse.pending, (state) => {
        state.enrolling = true;
        state.error = null;
      })
      .addCase(enrollFreeCourse.fulfilled, (state, action) => {
        state.enrolling = false;

        const { courseId, enrolled } = action.payload;

        if (enrolled) {
          enrollmentAdapter.upsertOne(state, {
            courseId,
            enrolledAt: new Date().toISOString(),
          });
        }
      })
      .addCase(enrollFreeCourse.rejected, (state, action) => {
        state.enrolling = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { resetEnrollmentError } = enrollmentSlice.actions;

export default enrollmentSlice.reducer;

// Selectors
export const {
  selectAll: selectMyCourses,
  selectById: selectEnrollmentByCourseId,
} = enrollmentAdapter.getSelectors((state) => state.enrollment);
