import { useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import useModal from "../useModal";

import { adminUpdateUser } from "../../features/users/usersThunks";
import { fetchAllRolePermissions } from "../../features/role_permissions/rolePermissionsThunks";

import { selectRolePermissions } from "../../features/role_permissions/rolePermissionsSlice";
import { selectAllRoles } from "../../features/roles/roleSlice";

const useUserRolePermission = () => {
  const dispatch = useDispatch();
  const rolePermissionModal = useModal("userRolePermission");

  const roles = useSelector(selectAllRoles);
  const rolePermissions = useSelector(selectRolePermissions);

  const [user, setUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // mở modal từ UserPage
  const openForUser = useCallback(
    (userData) => {
      setUser(userData);

      const roleId =
        typeof userData.role_id === "object"
          ? userData.role_id._id
          : userData.role_id;

      setSelectedRoleId(roleId);
      rolePermissionModal.open();
    },
    [rolePermissionModal]
  );

  // permission theo role (readonly)
  const permissionsByRole = useMemo(() => {
    if (!selectedRoleId) return [];

    return rolePermissions
      .filter((rp) => String(rp.roleId) === String(selectedRoleId))
      .map((rp) => rp.permissionId);
  }, [selectedRoleId, rolePermissions]);

  // submit = CHỈ đổi role user
  const submitChangeRole = useCallback(async () => {
    if (!user || !selectedRoleId) return;

    await dispatch(
      adminUpdateUser({
        userId: user.id,
        data: { role_id: selectedRoleId },
      })
    );

    rolePermissionModal.close();
  }, [dispatch, user, selectedRoleId, rolePermissionModal]);

  useEffect(() => {
    dispatch(fetchAllRolePermissions());
  }, [dispatch]);

  return {
    rolePermissionModal,
    user,
    roles,

    selectedRoleId,
    setSelectedRoleId,

    permissionsByRole,

    openForUser,
    submitChangeRole,
  };
};

export default useUserRolePermission;
