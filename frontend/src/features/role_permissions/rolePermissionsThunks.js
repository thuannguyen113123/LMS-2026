import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";
import { addToast } from "../ui/uiSlice";

// Fetch tất cả permission của 1 role

export const fetchRolePermissions = createAsyncThunk(
  "rolePermissions/fetchRolePermissions",
  async ({ roleId, search = "" }, { rejectWithValue }) => {
    try {
      const res = await api.get("/role-permissions", {
        params: { roleId, search },
      });

      const data = res.data.data; // <-- Array chứa 1 phần tử có permissionIds

      // Flatten thành mảng các record { roleId, permissionId }
      const flattened = [];

      data.forEach((item) => {
        const { roleId, permissionIds } = item;
        permissionIds.forEach((pid) => {
          flattened.push({ roleId, permissionId: pid });
        });
      });

      return flattened; // Trả về đúng structure reducer đang cần
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);
// Fetch tất cả permission của tất cả roles
export const fetchAllRolePermissions = createAsyncThunk(
  "rolePermissions/fetchAllRolePermissions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/role-permissions"); // Không truyền roleId

      const data = res.data.data;

      const flattened = [];

      data.forEach(({ roleId, permissionIds }) => {
        permissionIds.forEach((pid) => {
          flattened.push({ roleId, permissionId: pid });
        });
      });

      return flattened;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// Gán 1 permission cho role
export const assignPermissionToRole = createAsyncThunk(
  "rolePermissions/assignPermissionToRole",
  async ({ roleId, permissionId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/role-permissions", { roleId, permissionId });
      dispatch(
        addToast({
          type: "success",
          title: "Gán quyền",
          message: "Quyền đã được gán thành công!",
        })
      );
      return res.data.data; // Thay vì return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// Thu hồi 1 permission khỏi role
export const revokePermissionFromRole = createAsyncThunk(
  "rolePermissions/revokePermissionFromRole",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/role-permissions/${id}`);
      dispatch(
        addToast({
          type: "success",
          title: "Thu hồi quyền",
          message: "Quyền đã được thu hồi!",
        })
      );
      return id; // Trả về id để xóa khỏi state
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// Gán nhiều quyền cùng lúc
export const assignManyPermissionsToRole = createAsyncThunk(
  "rolePermissions/assignManyPermissionsToRole",
  async ({ roleId, permissionIds }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/role-permissions/bulk", {
        roleId,
        permissionIds,
      });
      dispatch(
        addToast({
          type: "success",
          title: "Gán nhiều quyền",
          message: "Các quyền đã được gán thành công!",
        })
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// Thu hồi nhiều quyền cùng lúc
export const revokeManyPermissionsFromRole = createAsyncThunk(
  "rolePermissions/revokeManyPermissionsFromRole",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      await api.post(`/role-permissions/delete-many`, { ids });
      dispatch(
        addToast({
          type: "success",
          title: "Thu hồi nhiều quyền",
          message: "Đã xóa nhiều quyền thành công!",
        })
      );
      return ids; // array of role_permission ids
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// Cập nhật một rolePermission
export const updateRolePermission = createAsyncThunk(
  "rolePermissions/updateRolePermission",
  async ({ roleId, permissionIds }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(`/role-permissions/${roleId}`, {
        roleId,
        permissionIds,
      });
      dispatch(
        addToast({
          type: "success",
          title: "Thành công",
          message: "Cập nhật quyền cho role thành công!",
        })
      );
      return res.data;
    } catch (err) {
      dispatch(addToast({ type: "error", title: "Lỗi", message: err.message }));
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Lấy chi tiết vai trò & quyền của một user
export const getUserRolePermissions = createAsyncThunk(
  "rolePermissions/getUserRolePermissions",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/role-permissions/${userId}`);
      return res.data; // giả định backend trả về { id, fullname, roles: [...], permissions: [...] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);
