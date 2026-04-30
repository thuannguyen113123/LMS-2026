import { createSlice } from "@reduxjs/toolkit";
import { fetchSuggestions } from "./chatSuggestionsThunks";

const initialState = {
  list: [],
  loading: false,
  error: null,
};

const chatSuggestionsSlice = createSlice({
  name: "chatSuggestions",
  initialState,

  reducers: {
    setSuggestions(state, action) {
      state.list = action.payload;
    },

    addSuggestion(state, action) {
      const user = action.payload;

      const exists = state.list.find((u) => u.id === user.id);

      if (!exists) {
        state.list.unshift(user);
      }
    },

    removeSuggestion(state, action) {
      const userId = action.payload;

      state.list = state.list.filter((u) => u.id !== userId);
    },

    setSuggestionsLoading(state, action) {
      state.loading = action.payload;
    },

    clearSuggestions(state) {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.suggestions; // QUAN TRỌNG
      })
      .addCase(fetchSuggestions.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setSuggestions,
  addSuggestion,
  removeSuggestion,
  setSuggestionsLoading,
  clearSuggestions,
} = chatSuggestionsSlice.actions;

export default chatSuggestionsSlice.reducer;
export const selectSuggestions = (state) => state.chatSuggestions.list;

export const selectSuggestionsLoading = (state) =>
  state.chatSuggestions.loading;
