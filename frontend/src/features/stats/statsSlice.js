import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAboutStats,
  fetchHeroStats,
  fetchHighlightStats,
} from "./statsThunks";

const initialState = {
  hero: {
    stats: {
      courses: 0,
      students: 0,
      instructors: 0,
      completionRate: 0,
    },
    topCourse: null,
  },
  about: {
    totalCourses: 0,
    courseGrowth: [],
  },
  highlights: {
    completedCourses: 0,
    satisfactionRate: 0,
    careerAdvancementRate: 0,
  },

  loading: false,
  errorCode: null,
  lastActionCode: null,
};

const statsSlice = createSlice({
  name: "stats",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(fetchHeroStats.pending, (state) => {
        state.loading = true;
        state.errorCode = null;
      })

      .addCase(fetchHeroStats.fulfilled, (state, action) => {
        state.loading = false;

        state.hero.stats = action.payload.stats.stats;
        state.hero.topCourse = action.payload.stats.topCourse;

        state.lastActionCode = action.payload.code;
      })

      .addCase(fetchHeroStats.rejected, (state, action) => {
        state.loading = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchHighlightStats.pending, (state) => {
        state.loading = true;
        state.errorCode = null;
      })

      .addCase(fetchHighlightStats.fulfilled, (state, action) => {
        state.loading = false;

        state.highlights = action.payload.stats;

        state.lastActionCode = action.payload.code;
      })

      .addCase(fetchHighlightStats.rejected, (state, action) => {
        state.loading = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchAboutStats.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchAboutStats.fulfilled, (state, action) => {
        state.loading = false;

        state.about = action.payload.stats;

        state.lastActionCode = action.payload.code;
      })

      .addCase(fetchAboutStats.rejected, (state, action) => {
        state.loading = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export default statsSlice.reducer;
export const selectHeroStats = (state) => state.stats.hero.stats;
export const selectStatsLoading = (state) => state.stats.loading;
export const selectStatsCode = (state) => state.stats.lastActionCode;

export const selectHeroTopCourse = (state) => state.stats.hero.topCourse;
export const selectHighlightStats = (state) => state.stats.highlights;
export const selectAboutStats = (state) => state.stats.about;
