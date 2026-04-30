import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

import {
  deleteManyContacts,
  fetchContactsAdmin,
  updateContactStatus,
} from "./contactsThunks";

export const contactsAdapter = createEntityAdapter({
  selectId: (contact) => contact.id,
});

/*
  ================================
  STATE
  ================================
  */

const initialState = contactsAdapter.getInitialState({
  lists: {
    admin: [],
  },

  loading: {
    admin: false,
    updateStatus: false,
    deleteMany: false,
  },

  errorCode: null,

  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
});

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(fetchContactsAdmin.pending, (state) => {
        state.loading.admin = true;
        state.errorCode = null;
      })

      .addCase(fetchContactsAdmin.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { contacts, pagination } = action.payload;

        contactsAdapter.upsertMany(state, contacts);

        state.lists.admin = contacts.map((c) => c.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchContactsAdmin.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(updateContactStatus.pending, (state) => {
        state.loading.updateStatus = true;
      })
      .addCase(updateContactStatus.fulfilled, (state, action) => {
        state.loading.updateStatus = false;
        const updated = action.payload;

        contactsAdapter.upsertOne(state, updated);
      })
      .addCase(updateContactStatus.rejected, (state) => {
        state.loading.updateStatus = false;
      })
      .addCase(deleteManyContacts.pending, (state) => {
        state.loading.deleteMany = true;
      })
      .addCase(deleteManyContacts.fulfilled, (state, action) => {
        state.loading.deleteMany = false;

        const ids = action.payload.deletedIds;

        // remove entity store
        contactsAdapter.removeMany(state, ids);

        // remove khỏi admin list
        state.lists.admin = state.lists.admin.filter((id) => !ids.includes(id));
      })
      .addCase(deleteManyContacts.rejected, (state) => {
        state.loading.deleteMany = false;
      });
  },
});
const selectors = contactsAdapter.getSelectors((state) => state.contacts);

export const selectContactEntities = selectors.selectEntities;

export const selectAdminContacts = createSelector(
  (state) => state.contacts.lists.admin,
  selectors.selectEntities,
  (ids, entities) => ids.map((id) => entities[id])
);
export default contactsSlice.reducer;
export const selectContactLoading = (state) => state.contacts.loading;
export const selectAdminContactsLoading = (state) =>
  state.contacts.loading.admin;

export const selectUpdateContactStatusLoading = (state) =>
  state.contacts.loading.updateStatus;
