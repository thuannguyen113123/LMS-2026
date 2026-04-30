import { createSlice } from "@reduxjs/toolkit";
import { fetchDashboard } from "./dashboardThunks";

const initialState = {
  kpis: null,

  charts: {
    revenueTrend: [],
    userGrowth: [],
    topCourses: [],
    progressChart: [],
  },

  learning: {
    continueLearning: [],
    quizzes: [],
    bookmarks: [],
  },

  panels: {
    recentOrders: [],
    recentUsers: [],
    auditLogs: [],
    reportedComments: [],
    activeChats: [],

    notifications: [],
    comments: [],
  },

  analytics: null,

  loading: false,
  errorCode: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.errorCode = null;
      })

      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;

        const data = action.payload?.data || {};

        state.kpis = data.kpis || null;

        state.charts = {
          ...initialState.charts,
          ...(data.charts || {}),
        };

        state.learning = {
          ...initialState.learning,
          ...(data.learning || {}),
        };

        state.panels = {
          ...initialState.panels,
          ...(data.panels || {}),
        };

        state.analytics = data.analytics || null;
      })

      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.errorCode = action.payload?.code || "DASHBOARD_FETCH_FAILED";
      });
  },
});

export default dashboardSlice.reducer;

export const selectDashboardKPIs = (state) => state.dashboard.kpis;
export const selectDashboardCharts = (state) => state.dashboard.charts;
export const selectDashboardLearning = (state) => state.dashboard.learning;
export const selectDashboardPanels = (state) => state.dashboard.panels;
export const selectDashboardAnalytics = (state) => state.dashboard.analytics;
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectDashboardErrorCode = (state) => state.dashboard.errorCode;
