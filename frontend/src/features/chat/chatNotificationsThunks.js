import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

export const fetchChatNotifications = createAsyncThunk(
  "chatNotifications/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/chat/notifications");

      return res.data.notifications;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
