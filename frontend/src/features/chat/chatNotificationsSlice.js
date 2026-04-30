import { createSlice } from "@reduxjs/toolkit";
import { fetchChatNotifications } from "./chatNotificationsThunks";

const chatNotificationsSlice = createSlice({
  name: "chatNotifications",
  initialState: {
    unreadByRoom: {},
    unreadTotal: 0,
    loading: false,
  },

  reducers: {
    notificationReceived(state, action) {
      const { roomId } = action.payload;

      if (!roomId) return;

      state.unreadByRoom[roomId] = (state.unreadByRoom[roomId] || 0) + 1;

      state.unreadTotal++;
    },

    roomRead(state, action) {
      const { roomId } = action.payload;

      const count = state.unreadByRoom[roomId];
      if (!count) return;

      state.unreadTotal -= count;
      delete state.unreadByRoom[roomId];
    },
  },

  extraReducers: (builder) => {
    builder.addCase(fetchChatNotifications.fulfilled, (state, action) => {
      const map = {};
      let total = 0;

      action.payload.forEach((n) => {
        if (n.isUnread) {
          map[n.roomId] = n.unreadCount || 0;
          total += n.unreadCount || 0;
        }
      });

      state.unreadByRoom = map;
      state.unreadTotal = total;
    });
  },
});

export const { notificationReceived, roomRead } =
  chatNotificationsSlice.actions;
export default chatNotificationsSlice.reducer;
export const selectChatUnreadByRoom = (state) =>
  state.chatNotifications.unreadByRoom;
