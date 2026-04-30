import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetch",

  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/dashboard");

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "DASHBOARD_FETCH_FAILED",
      });
    }
  }
);
