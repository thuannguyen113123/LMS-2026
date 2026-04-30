import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import {
  fetchRolePermissions,
  updateRolePermission,
  getUserRolePermissions,
  fetchAllRolePermissions,
} from "./rolePermissionsThunks";

// Adapter
const rolePermissionsAdapter = createEntityAdapter({
  selectId: (item) => `${item.roleId}_${item.permissionId}`, // tạo ID duy nhất
});

// Initial State
const initialState = rolePermissionsAdapter.getInitialState({
  loading: {
    rolePermissions: false,
    update: false,
    fetchAll: false,
  },
  error: null,
  currentRoleId: null,
  userRoleDetail: null,
  userRoleDetailLoading: false,
});

const rolePermissionsSlice = createSlice({
  name: "rolePermissions",
  initialState,
  reducers: {
    setCurrentRoleId(state, action) {
      state.currentRoleId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRolePermissions
      .addCase(fetchRolePermissions.pending, (state) => {
        state.loading.rolePermissions = true;
        state.error = null;
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        state.loading.rolePermissions = false;
        const dataWithId = action.payload.map((item) => ({
          ...item,
          id: `${item.roleId}_${item.permissionId}`,
        }));
        rolePermissionsAdapter.setAll(state, dataWithId);
      })
      .addCase(fetchRolePermissions.rejected, (state, action) => {
        state.loading.rolePermissions = false;
        state.error = action.payload || action.error.message;
      })

      // updateRolePermission
      .addCase(updateRolePermission.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateRolePermission.fulfilled, (state, action) => {
        state.loading.update = false;
        const updated = action.payload;
        const id = `${updated.roleId}_${updated.permissionId}`;
        rolePermissionsAdapter.upsertOne(state, { ...updated, id });
      })
      .addCase(updateRolePermission.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload || action.error.message;
      })

      // getUserRolePermissions
      .addCase(getUserRolePermissions.pending, (state) => {
        state.userRoleDetailLoading = true;
        state.error = null;
      })
      .addCase(getUserRolePermissions.fulfilled, (state, action) => {
        state.userRoleDetailLoading = false;
        state.userRoleDetail = action.payload;
      })
      .addCase(getUserRolePermissions.rejected, (state, action) => {
        state.userRoleDetailLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Trong extraReducers
      .addCase(fetchAllRolePermissions.pending, (state) => {
        state.loading.fetchAll = true;
        state.error = null;
      })
      .addCase(fetchAllRolePermissions.fulfilled, (state, action) => {
        state.loading.fetchAll = false;

        const dataWithId = action.payload.map((item) => ({
          ...item,
          id: `${item.roleId}_${item.permissionId}`,
        }));

        rolePermissionsAdapter.setAll(state, dataWithId);
      })

      .addCase(fetchAllRolePermissions.rejected, (state, action) => {
        state.loading.fetchAll = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setCurrentRoleId } = rolePermissionsSlice.actions;

export default rolePermissionsSlice.reducer;

// Selectors from adapter
export const {
  selectAll: selectAllRolePermissions,
  selectById: selectRolePermissionById,
  selectIds: selectRolePermissionIds,
} = rolePermissionsAdapter.getSelectors((state) => state.rolePermissions);

export const selectRolePermissions = (state) => selectAllRolePermissions(state);

export const selectRolePermissionsLoading = (state) =>
  state.rolePermissions.loading;

export const selectUserRoleDetail = (state) =>
  state.rolePermissions.userRoleDetail;

export const selectUserRoleDetailLoading = (state) =>
  state.rolePermissions.userRoleDetailLoading;
export const selectAllRolePermissionsLoading = (state) =>
  state.rolePermissions.loading.fetchAll;
export const selectRolePermissionsFetchLoading = (state) =>
  state.rolePermissions.loading.fetchAll;

export const selectRolePermissionsUpdateLoading = (state) =>
  state.rolePermissions.loading.update;
