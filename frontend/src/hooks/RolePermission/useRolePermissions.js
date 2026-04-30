import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import useModal from "../useModal";
import useDebounce from "../useDebounce";

import { fetchRoles } from "../../features/roles/roleThunks";
import { fetchPermissions } from "../../features/permissions/permissionsThunks";

import {
  fetchAllRolePermissions,
  updateRolePermission,
} from "../../features/role_permissions/rolePermissionsThunks";

import {
  selectAllRoles,
  selectRolesAdminLoading,
} from "../../features/roles/roleSlice";
import {
  selectAllPermissions,
  selectPermissionsAdminLoading,
} from "../../features/permissions/permissionsSlice";

import {
  selectRolePermissions,
  selectRolePermissionsFetchLoading,
} from "../../features/role_permissions/rolePermissionsSlice";

import {
  exportExcel,
  exportPDF,
} from "../../components/utils/exportImportUtils";

import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";

const useRolePermissions = () => {
  const dispatch = useDispatch();

  /*** UI STATE ***/
  const [search, setSearch] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [editRolePermission, setEditRolePermission] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [exportType, setExportType] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  /*** MODALS ***/
  const rolePermissionModal = useModal("rolePermissionModal");
  const exportPreviewModal = useModal("exportPreview");
  const confirmDeleteModal = useModal("confirmDelete");

  /*** REDUX STATE ***/
  const roles = useSelector(selectAllRoles);
  const permissions = useSelector(selectAllPermissions);
  const rolesLoading = useSelector(selectRolesAdminLoading);
  const permsLoading = useSelector(selectPermissionsAdminLoading);

  const rolePermissions = useSelector(selectRolePermissions);
  const rolePermissionsLoading = useSelector(selectRolePermissionsFetchLoading);

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /*** EFFECTS ***/
  // Fetch roles + permissions + all rolePermissions on mount or search change
  useEffect(() => {
    dispatch(fetchRoles({ limit: 99999, search: debouncedSearch }));
    dispatch(fetchPermissions({ limit: 99999, search: debouncedSearch }));
    dispatch(fetchAllRolePermissions());
  }, [dispatch, debouncedSearch]);

  // Set selectedPermissionIds when opening modal, based on existing data in store

  useEffect(() => {
    if (!rolePermissionModal.isOpen || !editRolePermission) return;

    const roleId = editRolePermission.id || editRolePermission._id;

    const currentPermissions = rolePermissions
      .filter((rp) => String(rp.roleId) === String(roleId))
      .map((rp) => rp.permissionId);

    setSelectedRoleId(roleId);
    setSelectedPermissionIds(currentPermissions);
  }, [rolePermissionModal.isOpen, editRolePermission, rolePermissions]);

  // Reset when closing modal
  useEffect(() => {
    if (!rolePermissionModal.isOpen) {
      setEditRolePermission(null);
      setSelectedPermissionIds([]);
      setSelectedRoleId(null);
    }
  }, [rolePermissionModal.isOpen]);

  /*** CALLBACKS ***/

  const togglePermission = useCallback((permId) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  }, []);

  // Submit updated permissions for the role
  const handleSubmitRolePermission = useCallback(async () => {
    if (!editRolePermission) return;

    try {
      const resultAction = await dispatch(
        updateRolePermission({
          roleId: selectedRoleId,
          permissionIds: selectedPermissionIds,
        })
      );

      // Kiểm tra nếu dispatch thành công
      if (updateRolePermission.fulfilled.match(resultAction)) {
        // Sau khi cập nhật xong, load lại permissions mới
        await dispatch(fetchAllRolePermissions());
        rolePermissionModal.close(); // Đóng sau khi đảm bảo xong
      } else {
        console.error("Cập nhật phân quyền thất bại:", resultAction);
        alert("Có lỗi xảy ra khi cập nhật phân quyền.");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật phân quyền:", err);
    }
  }, [
    dispatch,
    editRolePermission,
    selectedPermissionIds,
    rolePermissionModal,
    selectedRoleId,
  ]);

  /*** EXPORT / IMPORT ***/
  const columns = useMemo(
    () => [
      { header: "Role", key: "roleName", tooltip: "Tên vai trò" },
      { header: "Permissions", key: "permissions", tooltip: "Các quyền" },
    ],
    []
  );

  const onExportPDF = useCallback(() => {
    exportPDF(previewData, [], columns, "role_permissions.pdf");
  }, [previewData, columns]);

  const onExportExcel = useCallback(() => {
    exportExcel(previewData, [], "role_permissions.xlsx");
  }, [previewData]);

  const handleExportWithPreview = useCallback(
    (type) => {
      const dataToExport = roles.map((role) => {
        const permsForRole = rolePermissions
          .filter((rp) => rp.roleId === role.id)
          .map((rp) => {
            const perm = permissions.find((p) => p.id === rp.permissionId);
            return perm ? perm.name : "";
          })
          .filter(Boolean)
          .join(", ");

        return {
          roleName: role.name,
          permissions: permsForRole,
        };
      });

      if (dataToExport.length === 0) {
        alert("Không có dữ liệu để xuất.");
        return;
      }

      setPreviewData(dataToExport);
      setExportType(type);
      exportPreviewModal.open();
    },
    [roles, rolePermissions, permissions, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (exportType === "pdf") {
      exportPDF(previewData, [], columns, "role_permissions.pdf");
    } else if (exportType === "excel") {
      exportExcel(previewData, [], "role_permissions.xlsx");
    }

    exportPreviewModal.close();
    setExportType(null);
    setPreviewData([]);
  }, [exportType, previewData, columns, exportPreviewModal]);

  /*** AUDIT LOG ***/
  const handleShowAllPermissionHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "role_permissions" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  /*** MEMO ***/
  const isLoading = rolesLoading || permsLoading || rolePermissionsLoading;

  const handleOpenRolePermission = useCallback(
    (role) => {
      const roleId = role?.id || role?._id;

      console.log("ROLE:", role);
      console.log("ROLE ID:", roleId);

      setEditRolePermission(role);
      setSelectedRoleId(roleId);
      rolePermissionModal.open();
    },
    [rolePermissionModal]
  );

  const isEmpty = useMemo(
    () =>
      !isLoading &&
      roles.length === 0 &&
      permissions.length === 0 &&
      (!rolePermissions || rolePermissions.length === 0),
    [isLoading, roles.length, permissions.length, rolePermissions]
  );

  const toggleRole = useCallback((roleId) => {
    setSelectedRoleId((prev) => (prev === roleId ? null : roleId));
  }, []);

  const rolePermissionsByRoleId = useMemo(() => {
    const map = {};
    rolePermissions.forEach((rp) => {
      if (!map[rp.roleId]) {
        map[rp.roleId] = [];
      }
      map[rp.roleId].push(rp.permissionId);
    });
    return map;
  }, [rolePermissions]);

  return {
    // Data
    roles,
    permissions,
    selectedPermissionIds,
    editRolePermission,
    rolePermissions,

    // UI
    search,
    setSearch,
    isEmpty,
    isLoading,

    // Modals
    rolePermissionModal,
    exportPreviewModal,
    confirmDeleteModal,

    // Logic
    handleOpenRolePermission,
    togglePermission,
    handleSubmitRolePermission,

    // Export
    handleExportWithPreview,
    handleConfirmExport,
    onExportExcel,
    onExportPDF,
    previewData,
    exportType,

    // Audit
    handleShowAllPermissionHistory,
    handleCloseLogModal,
    logData,
    isLogModalOpen,
    logLoading,

    // Role collapse toggle
    toggleRole,
    selectedRoleId,
    setSelectedRoleId,
    rolePermissionsByRoleId,
    setSelectedPermissionIds,
  };
};

export default useRolePermissions;
