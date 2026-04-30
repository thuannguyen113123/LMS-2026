import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  deleteManyNotifications,
  fetchMyNotifications,
  fetchNotificationSettings,
  markNotificationsAsRead,
  updateNotificationSettings,
} from "./notificationThunks";
import {
  approveInstructorRequest,
  rejectInstructorRequest,
} from "../instructorRequest/instructorRequestThunks";

const notificationAdapter = createEntityAdapter({
  selectId: (n) => n.id,
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState: notificationAdapter.getInitialState({
    loading: false,
    error: null,
    notificationSettings: {},
    lists: {
      my: [],
    },

    pagination: {
      nextCursor: null,
      hasMore: true,
    },
  }),
  reducers: {
    addNotification: (state, action) => {
      const n = action.payload;

      notificationAdapter.upsertOne(state, n);

      // ✅ thêm vào list nếu chưa có
      if (!state.lists.my.includes(n.id)) {
        state.lists.my.unshift(n.id);
      }
    },
    toggleNotificationSetting: (state, action) => {
      const { key } = action.payload;

      if (!state.notificationSettings) return;

      state.notificationSettings[key] = !state.notificationSettings[key];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (state, action) => {
        if (!action.meta.arg?.isLoadMore) {
          state.loading = true;
        }
      })

      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        const { notifications, pagination, isLoadMore } = action.payload;

        state.loading = false;

        // cache entities
        notificationAdapter.upsertMany(state, notifications);

        if (isLoadMore) {
          state.lists.my.push(...notifications.map((n) => n.id));
        } else {
          state.lists.my = notifications.map((n) => n.id);
        }

        state.pagination.nextCursor = pagination.nextCursor;
        state.pagination.hasMore = pagination.hasNext;
      })

      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.notificationSettings = {
          ...state.notificationSettings,
          ...action.payload,
        };
      })
      .addCase(markNotificationsAsRead.fulfilled, (state, action) => {
        const ids = action.payload;
        ids.forEach((id) => {
          if (state.entities[id]) state.entities[id].read = true;
        });
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.notificationSettings = action.payload;
      })
      .addCase(deleteManyNotifications.fulfilled, (state, action) => {
        const { deletedIds } = action.payload;

        deletedIds.forEach((id) => {
          delete state.entities[id];
        });

        state.lists.my = state.lists.my.filter(
          (id) => !deletedIds.includes(id)
        );
      })
      .addCase(approveInstructorRequest.fulfilled, (state, action) => {
        const id = action.payload.requestId;

        Object.values(state.entities).forEach((n) => {
          if (n.entityId === id) {
            n.read = true;
            n.meta = {
              ...n.meta,
              status: "approved",
            };
          }
        });
      })

      .addCase(rejectInstructorRequest.fulfilled, (state, action) => {
        const id = action.payload.requestId;

        Object.values(state.entities).forEach((n) => {
          if (n.entityId === id) {
            n.read = true;
            n.meta = {
              ...n.meta,
              status: "rejected",
            };
          }
        });
      });
  },
});
export const { addNotification, toggleNotificationSetting } =
  notificationSlice.actions;
export default notificationSlice.reducer;

export const { selectAll: selectAllNotifications } =
  notificationAdapter.getSelectors((state) => state.notifications);
export const selectMyNotifications = createSelector(
  [
    (state) => state.notifications.lists.my,
    (state) => state.notifications.entities,
  ],
  (ids, entities) => ids.map((id) => entities[id]).filter(Boolean)
);
