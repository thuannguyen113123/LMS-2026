import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  createMessage,
  updateMessage,
  deleteMessage,
  reactMessage,
  unreactMessage,
  addReply,
  markViolation,
  removeManyMessages,
  fetchAdminMessages,
  fetchRoomMessages,
} from "./messagesThunks";

const messagesAdapter = createEntityAdapter({
  selectId: (message) => message.id,
});

// Initial state từ adapter + thêm custom field
const initialState = messagesAdapter.getInitialState({
  loading: false,
  error: null,

  currentRoom: null,

  lists: {
    adminMessages: {
      ids: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      loading: false,
    },

    roomMessages: {},
    typingUsers: {},
    readReceipts: {},
  },
  loadingByRoom: {},
  messagesByRoom: {},
});

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    goToPrevPage(state) {
      if (state.prevPageTokens.length > 0) {
        state.prevPageTokens.pop();
        state.page = Math.max(1, state.page - 1);
      }
    },
    clearRoomMessages(state, action) {
      const roomId = action.payload;

      state.lists.roomMessages[roomId] = {
        ids: [],
        pagination: {
          nextCursor: null,
          hasNext: true,
        },
        loading: false,
      };
    },
    addMessageFromSocket(state, action) {
      const message = {
        ...action.payload,
        replyTo: action.payload.replyTo ?? null,
      };

      messagesAdapter.upsertOne(state, message);

      const roomId = message.roomId;

      if (!state.lists.roomMessages[roomId]) {
        state.lists.roomMessages[roomId] = {
          ids: [],
          pagination: {
            nextCursor: null,
            hasNext: true,
          },
          loading: false,
        };
      }

      const roomList = state.lists.roomMessages[roomId];

      if (!roomList.ids.includes(message.id)) {
        roomList.ids.push(message.id);
      }

      // admin realtime
      const adminList = state.lists.adminMessages;

      if (adminList && !adminList.ids.includes(message.id)) {
        adminList.ids.unshift(message.id);
      }
    },

    updateMessageFromSocket(state, action) {
      const { id, changes } = action.payload;

      const existing = state.entities[id];
      if (!existing) return;

      messagesAdapter.updateOne(state, {
        id,
        changes: {
          ...changes,
          clientTempId: existing.clientTempId, // 🔥 giữ lại tempId
        },
      });
    },
    updateAttachmentProgress(state, action) {
      const { messageId, progress } = action.payload;

      const msg = state.entities[messageId];
      if (!msg) return;

      if (msg.attachments?.length) {
        msg.attachments[0].progress = progress;
      }
    },

    removeMessageFromSocket(state, action) {
      const id = action.payload;

      messagesAdapter.removeOne(state, id);

      // remove admin list
      state.lists.adminMessages.ids = state.lists.adminMessages.ids.filter(
        (i) => i !== id
      );

      // remove all room lists
      Object.values(state.lists.roomMessages).forEach((list) => {
        list.ids = list.ids.filter((i) => i !== id);
      });
    },
    setActiveRoom(state, action) {
      state.currentRoom = action.payload;

      state.error = null;
    },
    setUserTyping(state, action) {
      const { roomId, userId, name } = action.payload;

      if (!state.lists.typingUsers[roomId]) {
        state.lists.typingUsers[roomId] = {};
      }

      state.lists.typingUsers[roomId][userId] = name;
    },

    removeUserTyping(state, action) {
      const { roomId, userId } = action.payload;

      delete state.lists.typingUsers?.[roomId]?.[userId];
    },
    setRoomReadReceipt(state, action) {
      const { roomId, userId, lastReadMessageId } = action.payload;

      if (!state.lists.readReceipts[roomId]) {
        state.lists.readReceipts[roomId] = {};
      }

      state.lists.readReceipts[roomId][userId] = lastReadMessageId;
    },
    addSystemMessage(state, action) {
      const { roomId, content } = action.payload;

      const id = `sys-${Date.now()}`;

      const message = {
        id,
        roomId,
        content,
        type: "system", // 🔥 key quan trọng
        createdAt: new Date().toISOString(),
      };

      messagesAdapter.addOne(state, message);

      if (!state.lists.roomMessages[roomId]) {
        state.lists.roomMessages[roomId] = {
          ids: [],
          pagination: {
            nextCursor: null,
            hasNext: true,
          },
          loading: false,
        };
      }

      state.lists.roomMessages[roomId].ids.push(id);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages

      .addCase(fetchRoomMessages.pending, (state, action) => {
        const { roomId } = action.meta.arg;
        state.loadingByRoom[roomId] = true;
        if (!state.lists.roomMessages[roomId]) {
          state.lists.roomMessages[roomId] = {
            ids: [],
            pagination: {
              nextCursor: null,
              hasNext: true,
            },
            loading: false,
          };
        }

        state.lists.roomMessages[roomId].loading = true;
      })
      .addCase(fetchRoomMessages.fulfilled, (state, action) => {
        const { roomId, messages, pagination, isLoadMore } = action.payload;
        state.loadingByRoom[roomId] = false;
        state.messagesByRoom[roomId] = messages;

        const list = state.lists.roomMessages[roomId];

        list.loading = false;

        messagesAdapter.upsertMany(state, messages);

        const newIds = messages.map((m) => m.id).reverse();

        if (isLoadMore) {
          const existing = new Set(list.ids);

          const uniqueNewIds = newIds.filter((id) => !existing.has(id));

          list.ids = [...uniqueNewIds, ...list.ids];
        } else {
          list.ids = newIds;
        }

        list.pagination = pagination;
      })
      .addCase(fetchRoomMessages.rejected, (state, action) => {
        const roomId = action.meta.arg.roomId;
        state.loadingByRoom[roomId] = false;
      })
      .addCase(fetchAdminMessages.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchAdminMessages.fulfilled, (state, action) => {
        const { messages, pagination } = action.payload;

        messagesAdapter.upsertMany(state, messages);

        const list = state.lists.adminMessages;

        list.ids = messages.map((m) => m.id);
        list.pagination = pagination;
      })

      .addCase(fetchAdminMessages.rejected, (state, action) => {
        state.loading = false;
        state.errorCode = action.payload?.code;
      })

      // Create message
      .addCase(createMessage.pending, (state) => {
        state.sending = true;
        state.errorCode = null;
      })

      .addCase(createMessage.fulfilled, (state, action) => {
        state.sending = false;
        state.lastActionCode = action.payload.code;
      })

      .addCase(createMessage.rejected, (state, action) => {
        state.sending = false;

        state.errorCode = action.payload?.code;
      })

      // Update message
      .addCase(updateMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMessage.fulfilled, (state, action) => {
        state.loading = false;

        const incoming = action.payload;
        const existing = Object.values(state.entities).find(
          (m) => m.id === incoming.id
        );

        messagesAdapter.upsertOne(state, {
          ...incoming,
          clientTempId: existing?.clientTempId ?? incoming.clientTempId,
        });
      })
      .addCase(updateMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Delete message
      .addCase(deleteMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.loading = false;

        const message = action.payload;

        messagesAdapter.updateOne(state, {
          id: message.id,
          changes: message,
        });
      })

      .addCase(deleteMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add reaction
      .addCase(reactMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reactMessage.fulfilled, (state, action) => {
        state.loading = false;
        const incoming = action.payload;
        const existing = Object.values(state.entities).find(
          (m) => m.id === incoming.id
        );

        messagesAdapter.upsertOne(state, {
          ...incoming,
          clientTempId: existing?.clientTempId ?? incoming.clientTempId,
        });
      })
      .addCase(reactMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Remove reaction
      .addCase(unreactMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unreactMessage.fulfilled, (state, action) => {
        state.loading = false;
        const incoming = action.payload;
        const existing = Object.values(state.entities).find(
          (m) => m.id === incoming.id
        );

        messagesAdapter.upsertOne(state, {
          ...incoming,
          clientTempId: existing?.clientTempId ?? incoming.clientTempId,
        });
      })
      .addCase(unreactMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Add reply
      .addCase(addReply.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReply.fulfilled, (state, action) => {
        state.loading = false;
        const incoming = action.payload;
        const existing = Object.values(state.entities).find(
          (m) => m.id === incoming.id
        );

        messagesAdapter.upsertOne(state, {
          ...incoming,
          clientTempId: existing?.clientTempId ?? incoming.clientTempId,
        });
      })
      .addCase(addReply.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Mark violation
      .addCase(markViolation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markViolation.fulfilled, (state, action) => {
        state.loading = false;
        const incoming = action.payload;
        const existing = Object.values(state.entities).find(
          (m) => m.id === incoming.id
        );

        messagesAdapter.upsertOne(state, {
          ...incoming,
          clientTempId: existing?.clientTempId ?? incoming.clientTempId,
        });
      })
      .addCase(markViolation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Remove many messages
      .addCase(removeManyMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeManyMessages.fulfilled, (state, action) => {
        state.loading = false;

        const ids = action.payload;

        messagesAdapter.removeMany(state, ids);

        // admin
        state.lists.adminMessages.ids = state.lists.adminMessages.ids.filter(
          (id) => !ids.includes(id)
        );

        // rooms
        Object.values(state.lists.roomMessages).forEach((list) => {
          list.ids = list.ids.filter((id) => !ids.includes(id));
        });
      })
      .addCase(removeManyMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  goToPrevPage,
  clearRoomMessages,
  addMessageFromSocket,
  updateMessageFromSocket,
  removeMessageFromSocket,
  setActiveRoom,
  setUserTyping,
  removeUserTyping,
  setRoomReadReceipt,
  addSystemMessage,
  updateAttachmentProgress,
} = messagesSlice.actions;

export default messagesSlice.reducer;

// Selectors chuẩn từ adapter
export const { selectAll: selectAllMessages, selectById: selectMessageById } =
  messagesAdapter.getSelectors((state) => state.messages);
export const makeSelectRoomMessages = (roomId) =>
  createSelector(
    (state) => state.messages.lists.roomMessages[roomId]?.ids,
    (state) => state.messages.entities,
    (ids = [], entities) => ids.map((id) => entities[id]).filter(Boolean)
  );

export const selectAdminMessages = (state) =>
  state.messages.lists.adminMessages.ids
    .map((id) => state.messages.entities[id])
    .filter(Boolean);
export const selectSortedMessages = createSelector(
  selectAllMessages,
  (messages) =>
    [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
);
export const selectRoomPagination = (roomId) => (state) =>
  state.messages.lists.roomMessages[roomId]?.pagination;

export const selectRoomLoading = (roomId) => (state) =>
  state.messages.lists.roomMessages[roomId]?.loading;
export const makeSelectMessageStatus = (roomId, messageId, myId) => (state) => {
  const receipts = state.messages.lists.readReceipts?.[roomId];

  if (!receipts) return "sent";

  const readers = Object.entries(receipts)
    .filter(([userId]) => userId !== myId)
    .map(([, lastReadId]) => lastReadId);

  if (!readers.length) return "sent";

  const ids = state.messages.lists.roomMessages?.[roomId]?.ids || [];

  const messageIndex = ids.indexOf(messageId);

  const maxReadIndex = Math.max(...readers.map((id) => ids.indexOf(id)));

  return messageIndex <= maxReadIndex ? "seen" : "sent";
};
