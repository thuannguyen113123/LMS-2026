import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { searchCourses } from "./searchThunks";

export const searchAdapter = createEntityAdapter({
  selectId: (course) => course.id,
  sortComparer: (a, b) => (b.enrollCount || 0) - (a.enrollCount || 0),
});

const initialState = searchAdapter.getInitialState({
  loading: false,
  errorCode: null,

  query: "",
  page: 1,
  limit: 10,

  hasMore: false,

  lastActionCode: null,
});

const searchSlice = createSlice({
  name: "search",

  initialState,

  reducers: {
    clearSearch(state) {
      searchAdapter.removeAll(state);

      state.query = "";
      state.page = 1;
      state.hasMore = false;
      state.errorCode = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(searchCourses.pending, (state) => {
        state.loading = true;
        state.errorCode = null;
      })

      .addCase(searchCourses.fulfilled, (state, action) => {
        state.loading = false;

        const { code, courses, pagination, query } = action.payload;

        state.lastActionCode = code;

        state.query = query;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.hasMore = pagination.hasMore;

        searchAdapter.setAll(state, courses);
      })

      .addCase(searchCourses.rejected, (state, action) => {
        state.loading = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const { clearSearch } = searchSlice.actions;

export default searchSlice.reducer;

export const {
  selectAll: selectSearchCourses,
  selectById: selectSearchCourseById,
  selectIds: selectSearchCourseIds,
} = searchAdapter.getSelectors((state) => state.search);

export const selectSearchLoading = (state) => state.search.loading;

export const selectSearchErrorCode = (state) => state.search.errorCode;
