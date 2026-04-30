import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import {
  fetchRoles,
  createRole,
  updateRole,
  createManyRoles,
  deleteManyRoles,
  exportRoles,
  previewExportRoles,
} from "./roleThunks";

const rolesAdapter = createEntityAdapter({
  selectId: (role) => role.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const initialState = rolesAdapter.getInitialState({
  lists: {
    admin: [],
  },

  loading: {
    admin: false,
    create: false,
    createMany: false,
    update: false,
    deleteMany: false,
    export: false,
  },
  error: null,
  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  errorCode: null,
  lastActionCode: null,

  exportPreview: null,
  previewLoading: false,

  bulk: {
    summary: null,
    skipped: [],
    errors: [],
  },
  usage: {},
  recentlyUpdatedIds: [],
});

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    setRecentlyUpdated: (state, action) => {
      const ids = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];

      state.recentlyUpdatedIds.push(...ids);
    },

    clearRecentlyUpdated: (state, action) => {
      state.recentlyUpdatedIds = state.recentlyUpdatedIds.filter(
        (id) => id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading.admin = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { roles, pagination } = action.payload;

        // cache entities
        rolesAdapter.upsertMany(state, roles);

        // admin list ids
        state.lists.admin = roles.map((r) => r.id);

        // pagination
        state.paginationAdmin = pagination;
      })

      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })

      // CREATE
      .addCase(createRole.pending, (state) => {
        state.loading.create = true;
        state.errorCode = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading.create = false;
        state.lastActionCode = action.payload.code;

        const role = action.payload.role;

        if (role) {
          rolesAdapter.addOne(state, role);
          state.lists.admin.unshift(role.id);

          state.recentlyUpdatedIds.push(role.id); // highlight
        }
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading.create = false;
        state.errorCode = action.payload?.code;
      })

      // CREATE MANY
      .addCase(createManyRoles.pending, (state) => {
        state.loading.createMany = true;
        state.errorCode = null;
      })
      .addCase(createManyRoles.fulfilled, (state, action) => {
        state.loading.createMany = false;
        state.lastActionCode = action.payload.code;

        if (action.payload.roles?.length) {
          rolesAdapter.addMany(state, action.payload.roles);

          const createdIds = action.payload.roles.map((r) => r.id);

          state.lists.admin.unshift(...createdIds);

          state.recentlyUpdatedIds.push(...createdIds); // highlight
        }

        if (action.payload.bulk) {
          state.bulk.summary = action.payload.bulk.summary;
          state.bulk.skipped = action.payload.bulk.skipped;
          state.bulk.errors = action.payload.bulk.errors;
        }
      })

      .addCase(createManyRoles.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })

      // DELETE MANY
      .addCase(deleteManyRoles.pending, (state) => {
        state.loading.deleteMany = true;
        state.errorCode = null;
      })
      .addCase(deleteManyRoles.fulfilled, (state, action) => {
        state.loading.deleteMany = false;

        const ids = action.payload.deletedIds;

        rolesAdapter.removeMany(state, ids);

        state.lists.admin = state.lists.admin.filter((id) => !ids.includes(id));

        state.lastActionCode = "ROLE_DELETE_MANY_SUCCESS";
      })
      .addCase(deleteManyRoles.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })

      // UPDATE
      .addCase(updateRole.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading.update = false;

        const role = action.payload;

        rolesAdapter.upsertOne(state, role);

        state.recentlyUpdatedIds.push(role.id); // highlight
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(previewExportRoles.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })
      .addCase(previewExportRoles.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;

        state.exportPreview = action.payload.preview;
      })
      .addCase(previewExportRoles.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(exportRoles.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })
      .addCase(exportRoles.fulfilled, (state, action) => {
        state.loading.export = false;
        console.log(action);

        state.lastActionCode = "ROLE_EXPORT_SUCCESS";
      })
      .addCase(exportRoles.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const { setRecentlyUpdated, clearRecentlyUpdated } = rolesSlice.actions;

export default rolesSlice.reducer;

export const {
  selectAll: selectAllRoles,
  selectById: selectRoleById,
  selectIds: selectRoleIds,
} = rolesAdapter.getSelectors((state) => state.roles);
export const selectAdminRoles = (state) =>
  state.roles.lists.admin.map((id) => state.roles.entities[id]).filter(Boolean);

export const selectRoleOptions = createSelector([selectAllRoles], (roles) =>
  roles.map((r) => ({
    label: r.name,
    value: r.id,
  }))
);
export const selectRolesLoading = (state) => state.roles.loading;
export const selectRolesAdminLoading = (state) => state.roles.loading.admin;

export const selectExportRolesLoading = (state) => state.roles.loading.export;
