import { createSlice } from "@reduxjs/toolkit";
import { fetchAuditLogs } from "./auditLogThunks";

const auditLogSlice = createSlice({
  name: "auditLogs",
  initialState: {
    list: [],
    loading: false,
    errorCode: null,
    lastActionCode: null,
    isOpen: false,
  },

  reducers: {
    openAuditModal: (state) => {
      state.isOpen = true;
    },

    closeAuditModal: (state) => {
      state.isOpen = false;
      state.list = [];
      state.errorCode = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.errorCode = null;
      })

      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.lastActionCode = action.payload.code;
        state.list = action.payload.logs;
      })

      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const { openAuditModal, closeAuditModal } = auditLogSlice.actions;

export default auditLogSlice.reducer;
