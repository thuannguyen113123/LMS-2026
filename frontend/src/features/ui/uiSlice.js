import { createSlice } from "@reduxjs/toolkit";

let toastId = 1;
const savedTheme = localStorage.getItem("theme");

const pageRequests = new Set();
const initialState = {
  theme: savedTheme || "light",
  appLoading: false,
  pageLoading: 0,
  actionLoading: 0,
  toasts: [],
  appInitialized: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },

    setTheme(state, action) {
      const theme = action.payload;
      if (theme === "light" || theme === "dark") {
        state.theme = theme;
      }
    },

    setAppInitialized(state, action) {
      state.appInitialized = action.payload;
    },
    startAppLoading(state) {
      state.appLoading = true;
    },
    stopAppLoading(state) {
      state.appLoading = false;
    },
    startActionLoading(state) {
      state.actionLoading++;
    },
    stopActionLoading(state) {
      state.actionLoading = Math.max(0, state.actionLoading - 1);
    },
    addToast(state, action) {
      const payload = action.payload;
      if (!payload || typeof payload !== "object") return;

      state.toasts.push({ id: toastId++, ...payload });
    },

    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    clearToasts(state) {
      state.toasts = [];
    },
  },

  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) =>
          action.type.endsWith("/pending") && action.meta?.page === true,
        (state, action) => {
          const requestId = action.meta.requestId;

          pageRequests.add(requestId);
          state.pageLoading = pageRequests.size;
        }
      )

      // ===== FULFILLED / REJECTED =====
      .addMatcher(
        (action) =>
          action.type.endsWith("/fulfilled") ||
          action.type.endsWith("/rejected"),
        (state, action) => {
          const requestId = action.meta?.requestId;

          if (pageRequests.has(requestId)) {
            pageRequests.delete(requestId);
            state.pageLoading = pageRequests.size;
          } else {
            console.log("SKIP (NOT PAGE):", {
              type: action.type,
              requestId,
            });
          }
        }
      );
  },
});

export const {
  toggleTheme,
  setTheme,
  setAppInitialized,

  startAppLoading,
  stopAppLoading,

  startActionLoading,
  stopActionLoading,

  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

export const selectGlobalLoading = (state) =>
  state.ui.appLoading || state.ui.pageLoading > 0;

export const selectAppLoading = (state) => state.ui.appLoading;
export const selectPageLoading = (state) => state.ui.pageLoading > 0;
export const selectActionLoading = (state) => state.ui.actionLoading > 0;

export default uiSlice.reducer;
