import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

export const fetchSuggestions = createAsyncThunk(
  "chatSuggestions/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/chat/requests/suggestions");

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const sendChatRequest = createAsyncThunk(
  "chatSuggestions/sendRequest",
  async (userId, { rejectWithValue }) => {
    try {
      console.log("🚀 SEND CHAT REQUEST →", userId);
      const res = await api.post("/chat/requests", {
        toUserId: userId,
      });
      console.log("✅ API RESPONSE:", res.data);
      return res.data;
    } catch (err) {
      console.log("❌ REQUEST ERROR:", err.response?.data);
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
