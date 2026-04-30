import { createSlice } from "@reduxjs/toolkit";
import { blockUser, fetchRelations, unblockUser } from "./userRelationsThunks";

const initialState = {
  relations: {}, // userId -> relation
  blocking: false,
  loaded: false,
};

const userRelationsSlice = createSlice({
  name: "userRelations",
  initialState,

  reducers: {
    setRelations(state, action) {
      state.relations = {};

      action.payload.forEach((r) => {
        const otherId = r.blockerId === r.me ? r.blockedId : r.blockerId;

        state.relations[otherId] = {
          isBlocked: true,
          blockedBy: r.blockerId === r.me ? "me" : "other",
        };
      });

      state.loaded = true;
    },

    // ⭐ realtime socket sync
    syncBlockState(state, action) {
      const { userA, userB, blockedBy, myId } = action.payload;

      if (!userA || !userB || !myId) return;

      const otherId = userA === myId ? userB : userB === myId ? userA : null;

      if (!otherId) return;

      // UNBLOCK
      if (!blockedBy) {
        delete state.relations[otherId];
        return;
      }

      state.relations[otherId] = {
        isBlocked: true,
        blockedBy: blockedBy === myId ? "me" : "other",
      };
    },
  },

  extraReducers: (builder) => {
    builder
      // ⭐ FETCH RELATIONS
      .addCase(fetchRelations.pending, (state) => {
        state.loaded = false;
      })
      .addCase(fetchRelations.fulfilled, (state, action) => {
        state.relations = {};

        const { myId, relations } = action.payload;

        relations.forEach((r) => {
          const otherId = r.blockerId === myId ? r.blockedId : r.blockerId;

          state.relations[otherId] = {
            isBlocked: true,
            blockedBy: r.blockerId === myId ? "me" : "other",
          };
        });

        state.loaded = true;
      })
      .addCase(fetchRelations.rejected, (state) => {
        state.loaded = true;
      })

      // ⭐ BLOCK / UNBLOCK LOADING ONLY
      .addCase(blockUser.pending, (state) => {
        state.blocking = true;
      })
      .addCase(blockUser.fulfilled, (state) => {
        state.blocking = false;
      })
      .addCase(blockUser.rejected, (state) => {
        state.blocking = false;
      })

      .addCase(unblockUser.pending, (state) => {
        state.blocking = true;
      })
      .addCase(unblockUser.fulfilled, (state) => {
        state.blocking = false;
      })
      .addCase(unblockUser.rejected, (state) => {
        state.blocking = false;
      });
  },
});

export const { syncBlockState, setRelations } = userRelationsSlice.actions;

export default userRelationsSlice.reducer;
export const selectBlockState = (userId) => (state) =>
  state.userRelations.relations[userId] || {
    isBlocked: false,
    blockedBy: null,
  };

export const selectBlocking = (state) => state.userRelations.blocking;

export const selectRelationsLoaded = (state) => state.userRelations.loaded;
