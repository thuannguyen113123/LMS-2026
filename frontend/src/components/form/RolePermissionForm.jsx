import React, { useEffect } from "react";
import { FaCheckSquare, FaSquare } from "react-icons/fa";

const RolePermissionForm = ({
  roles = [],
  permissions = [],
  rolePermissions = [], // <-- cần truyền vào
  selectedRoleId = null,
  selectedPermissionIds = [],
  setSelectedRoleId,
  setSelectedPermissionIds,
  togglePermission,
  onSubmit,
  isLoading = false,
  user = {},
}) => {
  const isEditingUser = !!user?.role_id;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  // Khi đang edit user và selectedRoleId thay đổi => tự động load quyền theo role

  useEffect(() => {
    if (!selectedRoleId) return;

    const currentPermissionIds = rolePermissions
      .filter((rp) => String(rp.roleId) === String(selectedRoleId))
      .map((rp) => rp.permissionId);

    setSelectedPermissionIds(currentPermissionIds);
  }, [selectedRoleId, rolePermissions, setSelectedPermissionIds]);

  return (
    <>
      {isLoading && (
        <div className="mb-2 text-blue-600 font-semibold">Đang tải...</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===== DANH SÁCH ROLE ===== */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Vai trò (Role)</h3>

          <div className="flex flex-wrap gap-4">
            {roles.map((role) => {
              const roleId = role.id || role._id;

              return (
                <label
                  key={roleId}
                  className={`flex items-start gap-3 px-4 py-3 border rounded cursor-pointer w-full md:w-[calc(50%-0.5rem)] transition
                ${
                  String(selectedRoleId) === String(roleId)
                    ? "bg-blue-50  border-blue-500 shadow-sm text-black"
                    : "hover:bg-gray-50"
                }`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={String(selectedRoleId) === String(roleId)}
                    onChange={() => setSelectedRoleId(roleId)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-base">{role.name}</div>
                    <div className="text-sm text-gray-500">
                      {role.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* ===== DANH SÁCH PERMISSION ===== */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Quyền hạn (Permissions)</h3>
            <div className="space-x-2 text-sm">
              <button
                type="button"
                disabled={isEditingUser}
                className={`px-3 py-1 rounded transition ${
                  isEditingUser
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
                onClick={() =>
                  setSelectedPermissionIds(permissions.map((p) => p.id))
                }
              >
                <FaCheckSquare className="inline-block mr-1" />
                Chọn tất cả
              </button>
              <button
                type="button"
                disabled={isEditingUser}
                className={`px-3 py-1 rounded transition ${
                  isEditingUser
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                }`}
                onClick={() => setSelectedPermissionIds([])}
              >
                <FaSquare className="inline-block mr-1" />
                Bỏ chọn tất cả
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissions.map((perm) => (
              <label
                key={perm.id}
                className={`flex items-start gap-3 p-4 border rounded transition ${
                  selectedPermissionIds.includes(perm.id)
                    ? "bg-green-50 border-green-500 shadow-sm"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPermissionIds.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                  className="mt-1"
                  disabled={isEditingUser}
                />
                <div>
                  <div className="font-medium text-base">{perm.name}</div>
                  <div className="text-xs text-gray-500 italic">
                    {perm.code}
                  </div>
                  {perm.description && (
                    <div className="text-sm text-gray-600">
                      {perm.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ===== SUBMIT ===== */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded text-white ${
              isLoading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </>
  );
};

export default RolePermissionForm;
