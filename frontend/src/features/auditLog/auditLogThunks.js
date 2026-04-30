import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// auditLogThunks.js
export const fetchAuditLogs = createAsyncThunk(
  "auditLogs/fetch",
  async ({ entityType, entityId }, { rejectWithValue }) => {
    try {
      const url = entityId
        ? `/audit-logs/${entityType}/${entityId}`
        : `/audit-logs/${entityType}`;

      const res = await api.get(url);

      const { code, data } = res.data;

      return {
        code,
        logs: data?.logs || res.data, // vì API thứ 2 trả raw array
      };
    } catch (err) {
      const res = err.response?.data;

      return rejectWithValue({
        code: res?.code || "SERVER_ERROR",
      });
    }
  }
);
