import { createSlice } from "@reduxjs/toolkit";
import {
  requestUpgradeInstructor,
  approveInstructorRequest,
  rejectInstructorRequest,
} from "./instructorRequestThunks";

const initialState = {
  loading: {
    request: false,
    approve: false,
    reject: false,
  },

  lastActionCode: null,
  errorCode: null,
  currentRequest: null,
  lastUpdatedRequestId: null,
};

const instructorRequestSlice = createSlice({
  name: "instructorRequest",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      // ===== REQUEST =====
      .addCase(requestUpgradeInstructor.pending, (state) => {
        state.loading.request = true;
        state.errorCode = null;
      })

      .addCase(requestUpgradeInstructor.fulfilled, (state, action) => {
        state.loading.request = false;
        state.lastActionCode = action.payload.code;
        state.currentRequest = action.payload.payload;
      })

      .addCase(requestUpgradeInstructor.rejected, (state, action) => {
        state.loading.request = false;
        state.errorCode = action.payload?.code;
      })

      // ===== APPROVE =====
      .addCase(approveInstructorRequest.pending, (state) => {
        state.loading.approve = true;
        state.errorCode = null;
      })

      .addCase(approveInstructorRequest.fulfilled, (state, action) => {
        state.loading.approve = false;
        state.lastActionCode = action.payload.code;
        state.lastUpdatedRequestId = action.payload.requestId;
      })

      .addCase(approveInstructorRequest.rejected, (state, action) => {
        state.loading.approve = false;
        state.errorCode = action.payload?.code;
      })

      // ===== REJECT =====
      .addCase(rejectInstructorRequest.pending, (state) => {
        state.loading.reject = true;
        state.errorCode = null;
      })

      .addCase(rejectInstructorRequest.fulfilled, (state, action) => {
        state.loading.reject = false;
        state.lastActionCode = action.payload.code;
        state.lastUpdatedRequestId = action.payload.requestId;
      })

      .addCase(rejectInstructorRequest.rejected, (state, action) => {
        state.loading.reject = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export default instructorRequestSlice.reducer;

export const selectInstructorRequestLoading = (state) =>
  state.instructorRequest.loading;
