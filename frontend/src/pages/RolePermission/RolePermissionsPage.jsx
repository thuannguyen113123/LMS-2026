import React from "react";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import ImportExportButtons from "../../components/common/ImportExportButtons";
import CommonModal from "../../components/modal/CommonModal";
import ExportPreviewModal from "../../components/modal/ExportPreviewModal";
import RolePermissionForm from "../../components/form/RolePermissionForm";

import { DataLoading, DataEmpty } from "../../components/common/DataStates";
import useRolePermissions from "../../hooks/RolePermission/useRolePermissions";

const RolePermissionsPage = () => {
  const {
    roles,
    permissions,
    selectedPermissionIds,
    setSelectedPermissionIds,

    search,
    setSearch,

    isEmpty,
    isLoading,

    rolePermissionModal,
    editRolePermission,
    handleOpenRolePermission,
    handleSubmitRolePermission,
    togglePermission,

    handleExportWithPreview,
    handleConfirmExport,
    exportPreviewModal,
    previewData,

    selectedRoleId,
    setSelectedRoleId,
    toggleRole,

    rolePermissionsByRoleId,
    rolePermissions,
  } = useRolePermissions();

  return (
    <>
      <div className="p-6 min-h-screen">
        <PageHeader
          title="Quản lý phân quyền"
          addButtonText="Thêm quyền vào role"
          onAddClick={() => handleOpenRolePermission(null)}
        />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <SearchInput
            placeholder="Tìm kiếm role hoặc quyền..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <ImportExportButtons
              onExportPDF={() => handleExportWithPreview("pdf")}
              onExportExcel={() => handleExportWithPreview("excel")}
            />
          </div>
        </div>

        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr className="table-tr">
                <th className="table-th">Role</th>
                <th className="table-th">Quyền (Permissions)</th>
                <th className="table-th">Hành động</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                <tr>
                  <td colSpan={3}>
                    <DataLoading message="Đang tải dữ liệu phân quyền..." />
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td colSpan={3}>
                    <DataEmpty message="Không có role hoặc quyền nào." />
                  </td>
                </tr>
              ) : (
                roles.map((role) => {
                  const permissionIds = rolePermissionsByRoleId[role.id] || [];
                  const permissionNames = permissions
                    .filter((perm) => permissionIds.includes(perm.id))
                    .map((perm) => perm.name);

                  const MAX_VISIBLE_PERMISSIONS = 3;
                  const visiblePermissions = permissionNames.slice(
                    0,
                    MAX_VISIBLE_PERMISSIONS
                  );
                  const hiddenCount =
                    permissionNames.length - MAX_VISIBLE_PERMISSIONS;

                  return (
                    <tr key={role.id} className="table-tr">
                      <td className="px-6 py-4 font-semibold">{role.name}</td>
                      <td className="px-6 py-4">
                        {visiblePermissions.join(", ")}
                        {hiddenCount > 0 && (
                          <span
                            className="text-gray-400 ml-1 cursor-pointer"
                            title={permissionNames.join(", ")}
                          >
                            +{hiddenCount} quyền
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => handleOpenRolePermission(role)}
                        >
                          Phân quyền
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal phân quyền */}
      <CommonModal
        isOpen={rolePermissionModal.isOpen}
        onClose={rolePermissionModal.close}
        title={`Phân quyền: ${editRolePermission?.name || "Thêm mới"}`}
        maxWidth="max-w-[90vw]"
        maxHeight="max-h-[90vh]"
      >
        <RolePermissionForm
          roles={roles}
          permissions={permissions}
          rolePermissions={rolePermissions}
          selectedPermissionIds={selectedPermissionIds}
          togglePermission={togglePermission}
          onSubmit={handleSubmitRolePermission}
          setSelectedPermissionIds={setSelectedPermissionIds}
          selectedRoleId={selectedRoleId}
          setSelectedRoleId={setSelectedRoleId}
          toggleRole={toggleRole}
        />
      </CommonModal>

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={exportPreviewModal.isOpen}
        onClose={exportPreviewModal.close}
        onConfirm={handleConfirmExport}
        columns={[
          { key: "roleName", header: "Role" },
          { key: "permissions", header: "Quyền" },
        ]}
        data={previewData}
      />
    </>
  );
};

export default RolePermissionsPage;
