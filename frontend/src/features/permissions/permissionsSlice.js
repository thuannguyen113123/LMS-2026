import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  createManyPermissions,
  deleteManyPermissions,
  previewExportPermissions,
  exportPermissions,
} from "./permissionsThunks";

// Adapter
const permissionsAdapter = createEntityAdapter({
  selectId: (permission) => permission.id,
});

// Initial State
const initialState = permissionsAdapter.getInitialState({
  loading: {
    admin: false,
    create: false,
    createMany: false,
    update: false,
    deleteMany: false,
    export: false,
  },
  error: null,
  lists: {
    admin: [],
  },

  paginationAdmin: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  exportPreview: null,
  previewLoading: false,
  recentlyUpdatedIds: [],
});

const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    resetPagination(state) {
      state.paginationAdmin = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
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

      // FETCH
      .addCase(fetchPermissions.pending, (state) => {
        state.loading.admin = true;
      })

      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading.admin = false;

        const { data, pagination } = action.payload;

        permissionsAdapter.upsertMany(state, data);

        state.lists.admin = data.map((p) => p.id);

        state.paginationAdmin = pagination;
      })

      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading.admin = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(createPermission.pending, (state) => {
        state.loading.create = true;
      })

      // CREATE
      .addCase(createPermission.fulfilled, (state, action) => {
        const permission = action.payload.permission;
        state.loading.create = false;

        permissionsAdapter.addOne(state, permission);

        state.lists.admin.unshift(permission.id);

        state.recentlyUpdatedIds.unshift(permission.id);

        state.lastActionCode = action.payload.code;
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.loading.create = false;

        state.errorCode = action.payload?.code;
      })
      .addCase(createManyPermissions.pending, (state) => {
        state.loading.createMany = true;
      })
      .addCase(createManyPermissions.fulfilled, (state, action) => {
        const { created, summary, code } = action.payload;
        state.loading.createMany = false;

        state.lastActionCode = code;
        state.lastBulkSummary = summary;

        if (created?.length) {
          permissionsAdapter.addMany(state, created);

          const ids = created.map((p) => p.id);

          state.lists.admin.unshift(...ids);

          state.recentlyUpdatedIds.push(...ids);
        }
      })
      .addCase(createManyPermissions.rejected, (state, action) => {
        state.loading.createMany = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(deleteManyPermissions.pending, (state) => {
        state.loading.deleteMany = true;
      })

      // DELETE MANY
      .addCase(deleteManyPermissions.fulfilled, (state, action) => {
        state.loading.deleteMany = false;
        const ids = action.payload;

        permissionsAdapter.removeMany(state, ids);

        state.lists.admin = state.lists.admin.filter((id) => !ids.includes(id));
      })
      .addCase(deleteManyPermissions.rejected, (state, action) => {
        state.loading.deleteMany = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(updatePermission.pending, (state) => {
        state.loading.update = true;
      })
      // UPDATE
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.loading.update = false;
        const permission = action.payload;

        permissionsAdapter.updateOne(state, {
          id: permission.id,
          changes: permission,
        });

        if (!state.recentlyUpdatedIds.includes(permission.id)) {
          state.recentlyUpdatedIds.push(permission.id);
        }

        state.lastActionCode = "PERMISSION_UPDATE_SUCCESS";
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.loading.update = false;
        state.errorCode = action.payload?.code;
      })

      // ===== PREVIEW EXPORT =====
      .addCase(previewExportPermissions.pending, (state) => {
        state.previewLoading = true;
        state.errorCode = null;
      })
      .addCase(previewExportPermissions.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.lastActionCode = action.payload.code;
        state.exportPreview = action.payload.preview;
      })
      .addCase(previewExportPermissions.rejected, (state, action) => {
        state.previewLoading = false;
        state.errorCode = action.payload?.code;
      })

      // ===== EXPORT =====
      .addCase(exportPermissions.pending, (state) => {
        state.loading.export = true;
        state.errorCode = null;
      })
      .addCase(exportPermissions.fulfilled, (state) => {
        state.loading.export = false;
        state.lastActionCode = "PERMISSION_EXPORT_SUCCESS";
      })
      .addCase(exportPermissions.rejected, (state, action) => {
        state.loading.export = false;
        state.errorCode = action.payload?.code;
      });
  },
});

export const { resetPagination, setRecentlyUpdated, clearRecentlyUpdated } =
  permissionsSlice.actions;

export default permissionsSlice.reducer;

// Selectors
export const {
  selectAll: selectAllPermissions,
  selectById: selectPermissionById,
  selectIds: selectPermissionIds,
} = permissionsAdapter.getSelectors((state) => state.permissions);
export const selectAdminPermissions = (state) =>
  state.permissions.lists.admin
    .map((id) => state.permissions.entities[id])
    .filter(Boolean);
export const selectPermissionsLoading = (state) => state.permissions.loading;
export const selectPermissionsAdminLoading = (state) =>
  state.permissions.loading.admin;

export const selectExportPermissionsLoading = (state) =>
  state.permissions.loading.export;
