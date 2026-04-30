import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

export const fetchChatRequests = createAsyncThunk(
  "chatRequests/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/chat/requests");

      const requests = res.data.data;

      const myId = getState().auth.user.id;

      // ⭐ SPLIT HERE
      const incoming = requests.filter((r) => r.toUser?.id === myId);

      const outgoing = requests.filter((r) => r.fromUser?.id === myId);

      return {
        incoming,
        outgoing,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);
