import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { syncBlockState } from "./userRelationsSlice";

export const blockUser = createAsyncThunk(
  "relations/blockUser",
  async (blockedUserId, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await api.post("/user-blocks", { blockedUserId });

      const myId = getState().auth.user.id;

      dispatch(
        syncBlockState({
          ...res.data.data,
          myId,
        })
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const unblockUser = createAsyncThunk(
  "relations/unblockUser",
  async (blockedUserId, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/user-blocks/${blockedUserId}`);

      const myId = getState().auth.user.id;

      dispatch(
        syncBlockState({
          ...res.data.data,
          myId,
        })
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);
export const fetchRelations = createAsyncThunk(
  "relations/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/user-blocks/relations");

      const myId = getState().auth.user.id;

      return {
        relations: res.data.data,
        myId,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);
