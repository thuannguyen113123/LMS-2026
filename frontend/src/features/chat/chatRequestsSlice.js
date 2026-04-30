import { createSlice, createSelector } from "@reduxjs/toolkit";
import { fetchChatRequests } from "./chatRequestsThunks";

const initialState = {
  loading: false,
  error: null,

  lists: {
    incoming: [],
    outgoing: [],
  },
};

const chatRequestsSlice = createSlice({
  name: "chatRequests",
  initialState,

  reducers: {
    setIncomingRequests(state, action) {
      state.lists.incoming = action.payload;
    },

    setOutgoingRequests(state, action) {
      state.lists.outgoing = action.payload;
    },

    addIncomingRequest(state, action) {
      const request = action.payload;

      const exists = state.lists.incoming.find((r) => r.id === request.id);

      if (!exists) {
        state.lists.incoming.unshift(request);
      }
    },

    addOutgoingRequest(state, action) {
      const request = action.payload;

      const exists = state.lists.outgoing.find((r) => r.id === request.id);

      if (!exists) {
        state.lists.outgoing.unshift(request);
      }
    },

    updateRequestStatus(state, action) {
      const { requestId, status } = action.payload;

      const incoming = state.lists.incoming.find((r) => r.id === requestId);
      if (incoming) incoming.status = status;

      const outgoing = state.lists.outgoing.find((r) => r.id === requestId);
      if (outgoing) outgoing.status = status;
    },

    removeRequest(state, action) {
      const requestId = action.payload;

      state.lists.incoming = state.lists.incoming.filter(
        (r) => r.id !== requestId
      );

      state.lists.outgoing = state.lists.outgoing.filter(
        (r) => r.id !== requestId
      );
    },

    clearRequests(state) {
      state.lists.incoming = [];
      state.lists.outgoing = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchChatRequests.fulfilled, (state, action) => {
        state.loading = false;

        state.lists.incoming = action.payload.incoming.filter(
          (r) => r.status === "pending"
        );

        state.lists.outgoing = action.payload.outgoing.filter(
          (r) => r.status === "pending"
        );
      })
      .addCase(fetchChatRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.code || "FETCH_FAILED";
      });
  },
});

export const {
  setIncomingRequests,
  setOutgoingRequests,
  addIncomingRequest,
  addOutgoingRequest,
  updateRequestStatus,
  removeRequest,
  clearRequests,
} = chatRequestsSlice.actions;

export default chatRequestsSlice.reducer;

export const selectIncomingRequests = (state) =>
  state.chatRequests.lists.incoming;

export const selectOutgoingRequests = (state) =>
  state.chatRequests.lists.outgoing;

export const selectIncomingCount = (state) =>
  state.chatRequests.lists.incoming.length;

export const selectPendingIncoming = createSelector(
  selectIncomingRequests,
  (requests) => requests.filter((r) => r.status === "pending")
);

const selectIncoming = (state) => state.chatRequests.lists.incoming;
const selectOutgoing = (state) => state.chatRequests.lists.outgoing;
export const selectChatRelation = createSelector(
  [selectIncoming, selectOutgoing, (_, userId) => userId],
  (incoming, outgoing, userId) => {
    if (incoming.some((r) => r.fromUser?.id === userId)) {
      return "INCOMING_PENDING";
    }

    if (outgoing.some((r) => r.toUser?.id === userId)) {
      return "OUTGOING_PENDING";
    }

    return "NONE";
  }
);
