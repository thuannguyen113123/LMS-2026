import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  addMemberToRoom,
  banUserFromRoom,
  createChatRoom,
  createManyChatRooms,
  createPrivateRoom,
  deleteManyChatRooms,
  exportChatRooms,
  fetchAdminChatRooms,
  fetchAdminChatRoomsAll,
  fetchRoomMembers,
  fetchRoomStats,
  fetchUserChatRooms,
  muteUserInRoom,
  previewExportChatRooms,
  removeMemberFromRoom,
  setAdminsInRoom,
  updateChatRoom,
  updateRoomSettings,
} from "./chatRoomsThunks";

// Adapter config
const chatRoomsAdapter = createEntityAdapter({
  selectId: (room) => room.id,
});

// Initial state from adapter + extra fields
const initialState = chatRoomsAdapter.getInitialState({
  loading: {
    admin: false,
    user: false,

    create: false,
    createMany: false,
    update: false,
    deleteMany: false,

    members: false,

    memberAction: false,
    settings: false,

    export: false,
  },
  updateLoading: false,
  error: null,
  updateError: null,
  filterType: "all",

  lists: {
    admin: [],
    user: [],
  },
  errorCode: null,
  lastActionCode: null,
  membersByRoom: {},
  membersLoading: false,
  exportPreview: null,
  previewLoading: false,
  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  paginationUser: {
    nextCursor: null,
    hasNext: false,
  },
  userPresence: {},
  markReadError: null,
  roomStatsByRoom: {},
  statsLoading: false,
  recentlyUpdatedIds: [],
});

const chatRoomsSlice = createSlice({
  name: "chatRooms",
  initialState,
  reducers: {
    setFilterType(state, action) {
      state.filterType = action.payload;
    },
    resetAdminPagination(state) {
      state.paginationAdmin = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },
    updateRoomFromMessage: (state, action) => {
      const { message } = action.payload;

      const roomId = message.roomId;
      const room = state.entities[roomId];

      if (!room) return;

      room.lastMessage = message;
    },
    resetUserPagination(state) {
      state.paginationUser = {
        nextCursor: null,
        hasNext: false,
      };
    },
    setUserPresence(state, action) {
      const { userId, status } = action.payload;
      console.log("🔥 REDUX PRESENCE UPDATE:", userId, status);

      state.userPresence[userId] = status;
    },
    setInitialPresence(state, action) {
      const onlineUsers = action.payload;

      onlineUsers.forEach((userId) => {
        state.userPresence[userId] = "online";
      });
    },
    resetError(state) {
      state.error = null;
    },
    addRoomFromSocket(state, action) {
      const room = action.payload;

      chatRoomsAdapter.upsertOne(state, room);

      if (!state.lists.user.includes(room.id)) {
        state.lists.user.unshift(room.id);
      }
    },
    setRecentlyUpdated: (state, action) => {
      state.recentlyUpdatedIds.push(action.payload);
    },

    clearRecentlyUpdated: (state, action) => {
      state.recentlyUpdatedIds = state.recentlyUpdatedIds.filter(
        (id) => id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH CHAT ROOMS
      .addCase(fetchAdminChatRooms.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchAdminChatRooms.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { rooms, pagination } = action.payload;

        chatRoomsAdapter.upsertMany(state, rooms);

        state.lists.admin = rooms.map((r) => r.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchAdminChatRooms.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchRoomStats.pending, (state) => {
        state.statsLoading = true;
      })

      .addCase(fetchRoomStats.fulfilled, (state, action) => {
        state.statsLoading = false;

        const { roomId, stats } = action.payload;

        state.roomStatsByRoom[roomId] = stats;
      })

      .addCase(fetchRoomStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(createPrivateRoom.fulfilled, (state, action) => {
        state.lastActionCode = action.payload.code;

        const room = action.payload.room;

        if (room) {
          chatRoomsAdapter.upsertOne(state, room);

          if (!state.lists.user.includes(room.id)) {
            state.lists.user.unshift(room.id);
          }

          // ⭐ highlight
          state.recentlyUpdatedIds.push(room.id);
        }
      })
      // CREATE CHAT ROOM
      .addCase(fetchUserChatRooms.pending, (state) => {
        state.loading.user = true;
      })

      .addCase(fetchUserChatRooms.fulfilled, (state, action) => {
        state.loading.user = false;

        const { rooms, pagination } = action.payload;

        const normalizedRooms = rooms;

        chatRoomsAdapter.upsertMany(state, normalizedRooms);

        if (action.meta.arg?.isLoadMore) {
          state.lists.user.push(...normalizedRooms.map((r) => r.id));
        } else {
          state.lists.user = normalizedRooms.map((r) => r.id);
        }

        state.paginationUser.nextCursor = pagination?.nextCursor || null;
        state.paginationUser.hasNext = pagination?.hasNext ?? false;
      })

      .addCase(fetchUserChatRooms.rejected, (state, action) => {
        state.loading.user = false;
        state.errorCode = action.payload?.code;
      })

      // CREATE CHAT ROOM
      .addCase(createChatRoom.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createChatRoom.fulfilled, (state, action) => {
        state.loading.create = false;
        state.lastActionCode = action.payload.code;

        const room = action.payload.room;

        if (room) {
          chatRoomsAdapter.addOne(state, room);
          state.lists.admin.unshift(room.id);

          // ⭐ highlight
          state.recentlyUpdatedIds.push(room.id);
        }
      })
      .addCase(createChatRoom.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload || action.error.message;
      })

      // CREATE MANY CHAT ROOMS
      .addCase(createManyChatRooms.pending, (state) => {
        state.loading.createMany = true;
        state.error = null;
      })
      .addCase(createManyChatRooms.fulfilled, (state, action) => {
        state.loading.createMany = false;

        const rooms = action.payload.created;

        if (rooms?.length) {
          chatRoomsAdapter.addMany(state, rooms);

          state.lists.admin.unshift(...rooms.map((r) => r.id));
        }
      })
      .addCase(createManyChatRooms.rejected, (state, action) => {
        state.loading.createMany = false;
        state.error = action.payload || action.error.message;
      })

      // UPDATE CHAT ROOM
      .addCase(updateChatRoom.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateChatRoom.fulfilled, (state, action) => {
        state.updateLoading = false;

        const room = action.payload;

        chatRoomsAdapter.upsertOne(state, room);

        // ⭐ highlight
        state.recentlyUpdatedIds.push(room.id);
      })
      .addCase(updateChatRoom.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || action.error.message;
      })

      // DELETE MANY CHAT ROOMS
      .addCase(deleteManyChatRooms.pending, (state) => {
        state.loading.deleteMany = true;
        state.error = null;
      })
      .addCase(deleteManyChatRooms.fulfilled, (state, action) => {
        state.loading.deleteMany = false;

        const ids = action.payload.deletedIds;

        chatRoomsAdapter.removeMany(state, ids);

        Object.keys(state.lists).forEach((key) => {
          state.lists[key] = state.lists[key].filter((id) => !ids.includes(id));
        });
      })
      .addCase(deleteManyChatRooms.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.error = action.payload || action.error.message;
      })

      // ADD MEMBER TO ROOM
      .addCase(addMemberToRoom.pending, (state) => {
        state.loading.memberAction = true;
        state.errorCode = null;
      })

      .addCase(addMemberToRoom.fulfilled, (state, action) => {
        state.loading.memberAction = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.room) {
          chatRoomsAdapter.upsertOne(state, action.payload.room);
        }
      })

      .addCase(addMemberToRoom.rejected, (state, action) => {
        state.loading.memberAction = false;
        state.errorCode = action.payload?.code || null;
      })

      // REMOVE MEMBER FROM ROOM
      .addCase(removeMemberFromRoom.pending, (state) => {
        state.loading.memberAction = true;
        state.errorCode = null;
      })

      .addCase(removeMemberFromRoom.fulfilled, (state, action) => {
        state.loading.memberAction = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.room) {
          chatRoomsAdapter.upsertOne(state, action.payload.room);
        }
      })

      .addCase(removeMemberFromRoom.rejected, (state, action) => {
        state.loading.memberAction = false;
        state.errorCode = action.payload?.code || null;
      })

      // SET ADMINS IN ROOM
      .addCase(setAdminsInRoom.pending, (state) => {
        state.loading.memberAction = true;
        state.errorCode = null;
      })

      .addCase(setAdminsInRoom.fulfilled, (state, action) => {
        state.loading.memberAction = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.room) {
          chatRoomsAdapter.upsertOne(state, action.payload.room);
        }
      })

      .addCase(setAdminsInRoom.rejected, (state, action) => {
        state.loading.memberAction = false;
        state.errorCode = action.payload?.code || null;
      })
      // BAN USER FROM ROOM
      .addCase(banUserFromRoom.pending, (state) => {
        state.loading.memberAction = true;
        state.errorCode = null;
      })

      .addCase(banUserFromRoom.fulfilled, (state, action) => {
        state.loading.memberAction = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.room) {
          chatRoomsAdapter.upsertOne(state, action.payload.room);
        }
      })

      .addCase(banUserFromRoom.rejected, (state, action) => {
        state.loading.memberAction = false;
        state.errorCode = action.payload?.code || null;
      })

      // MUTE USER IN ROOM
      .addCase(muteUserInRoom.pending, (state) => {
        state.loading.memberAction = true;
        state.errorCode = null;
      })

      .addCase(muteUserInRoom.fulfilled, (state, action) => {
        state.loading.memberAction = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.room) {
          chatRoomsAdapter.upsertOne(state, action.payload.room);
        }
      })

      .addCase(muteUserInRoom.rejected, (state, action) => {
        state.loading.memberAction = false;
        state.errorCode = action.payload?.code || null;
      })

      // UPDATE ROOM SETTINGS
      .addCase(updateRoomSettings.pending, (state) => {
        state.loading.settings = true;
        state.error = null;
      })
      .addCase(updateRoomSettings.fulfilled, (state, action) => {
        state.loading.settings = false;

        const { room } = action.payload;

        chatRoomsAdapter.updateOne(state, {
          id: room.id,
          changes: room,
        });
        state.recentlyUpdatedIds.push(room.id);
      })
      .addCase(updateRoomSettings.rejected, (state, action) => {
        state.loading.settings = false;
        state.error = action.payload || action.error.message;
      })

      // FETCH ADMIN CHAT ROOMS ALL
      .addCase(fetchAdminChatRoomsAll.pending, (state) => {
        state.loading.admin = true;
        state.error = null;
      })
      .addCase(fetchAdminChatRoomsAll.fulfilled, (state, action) => {
        state.loading.admin = false;
        chatRoomsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchAdminChatRoomsAll.rejected, (state, action) => {
        state.loading.admin = false;
        state.error = action.payload || action.error.message;
      })

      // FETCH ADMIN ROOM MEMBERS
      .addCase(fetchRoomMembers.pending, (state) => {
        state.membersLoading = true;
      })

      .addCase(fetchRoomMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.lastActionCode = action.payload.code;

        const { roomId, data } = action.payload;

        state.membersByRoom[roomId] = data;
      })

      .addCase(fetchRoomMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.errorCode = action.payload?.code;
      })
      // ===== PREVIEW EXPORT CHATROOMS =====

      .addCase(previewExportChatRooms.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })

      .addCase(previewExportChatRooms.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })

      .addCase(previewExportChatRooms.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      .addCase(exportChatRooms.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })

      .addCase(exportChatRooms.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "CHATROOM_EXPORT_SUCCESS";
      })

      .addCase(exportChatRooms.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const {
  setFilterType,
  resetAdminPagination,
  resetUserPagination,
  resetError,
  updateRoomFromMessage,
  setUserPresence,
  setInitialPresence,
  addRoomFromSocket,
  setRecentlyUpdated,
  clearRecentlyUpdated,
} = chatRoomsSlice.actions;

export default chatRoomsSlice.reducer;

// Selectors
export const {
  selectAll: selectAllChatRooms,
  selectById: selectChatRoomById,
  selectIds: selectChatRoomIds,
} = chatRoomsAdapter.getSelectors((state) => state.chatRooms);
export const selectAdminChatRooms = (state) =>
  state.chatRooms.lists.admin
    .map((id) => state.chatRooms.entities[id])
    .filter(Boolean);

export const selectUserChatRooms = (state) =>
  state.chatRooms.lists.user
    .map((id) => state.chatRooms.entities[id])
    .filter(Boolean);

export const selectOtherUserId = createSelector(
  [
    (state, roomId) => state.chatRooms.entities[roomId],
    (state) => state.auth.user,
  ],
  (room, authUser) => {
    if (!room || room.type !== "private") return null;

    const myId = authUser?.id || authUser?._id;

    return room.user_ids?.find((id) => id !== myId) || null;
  }
);
export const selectRoomStats = (state, roomId) =>
  state.chatRooms.roomStatsByRoom[roomId] || null;
export const selectIsChatReady = (state) => {
  const userReady = !!state.auth.user;

  const persistReady = state._persist?.rehydrated === true;

  const roomsReady =
    state.chatRooms.lists.user && state.chatRooms.lists.user.length > 0;

  const relationsReady = state.userRelations.loaded;

  return userReady && persistReady && roomsReady && relationsReady;
};
export const selectChatRoomsLoading = (state) => state.chatRooms.loading;
export const selectAdminChatRoomsLoading = (state) =>
  state.chatRooms.loading.admin;

export const selectUserChatRoomsLoading = (state) =>
  state.chatRooms.loading.user;

export const selectCreateChatRoomLoading = (state) =>
  state.chatRooms.loading.create;

export const selectUpdateChatRoomLoading = (state) =>
  state.chatRooms.loading.update;

export const selectMemberActionLoading = (state) =>
  state.chatRooms.loading.memberAction;

export const selectRoomMembersLoading = (state) =>
  state.chatRooms.loading.members;

export const selectRoomStatsLoading = (state) => state.chatRooms.loading.stats;

export const selectExportPreviewLoading = (state) =>
  state.chatRooms.loading.exportPreview;

export const selectExportChatRoomsLoading = (state) =>
  state.chatRooms.loading.export;
