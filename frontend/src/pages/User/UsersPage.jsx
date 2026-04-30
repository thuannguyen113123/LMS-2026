import React from "react";
import { FaHistory } from "react-icons/fa";

import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import ImportExportButtons from "../../components/common/ImportExportButtons";
import UndoSnackbar from "../../components/common/UndoSnackbar";
import Pagination from "../../components/Pagintion/Pagination";
import CommonModal from "../../components/modal/CommonModal";
import ConfirmModal from "../../components/modal/ConfirmModal";
import ExportPreviewModal from "../../components/modal/ExportPreviewModal";
import AuditLogModal from "../../components/modal/AuditLogModal";
import DataRow from "../../components/common/DataRow";
import TableHeader from "../../components/common/TableHeader";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../components/common/DataStates";

import useSortableData from "../../hooks/useSortableData";
import UserForm from "../../components/form/User/UserForm";
import FilterSelect from "../../components/common/FilterSelect";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import { useSelector } from "react-redux";
import { selectRoleOptions } from "../../features/roles/roleSlice";
import useUsers from "../../hooks/User/useUser";

const UserPage = () => {
  const {
    users,
    loading,
    error,
    isEmpty,

    // Pagination
    page,
    handleNext,
    handlePrev,
    hasNext,
    hasPrev,
    totalPages,
    handlePageChange,

    // Search
    search,
    setSearch,

    // Selection
    selected,
    handleSelect,
    handleSelectAll,

    // CRUD
    handleSubmit,
    handleDelete,
    handleDeleteSelected,
    handleUndo,
    recentlyDeleted,
    editUser,
    setEditUser,
    confirmDelete,
    pendingDeleteIds,

    // Export / Import
    onImportExcel,
    handleExportWithPreview,
    handleConfirmExport,
    exportPreview,
    previewLoading,

    // Modals
    userFormModal,
    confirmDeleteModal,
    exportPreviewModal,

    // Audit log
    handleShowAllUserHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,

    // Table configs
    columns,

    recentlyUpdatedIds,
    handleInlineUpdate,

    filterRoleId,
    setFilterRoleId,
    isSubmitting,
  } = useUsers();

  const {
    sortedItems: sortedUsers,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(users, columns);

  const roleOptions = useSelector(selectRoleOptions);

  const columnsConfig = [
    {
      key: "role_id",
      editableType: "select",
      options: roleOptions,
      path: "role_id.name",
    },
    {
      key: "isActive",
      editableType: "select",
      options: [
        { label: "Active", value: true },
        { label: "Inactive", value: false },
      ],
    },
    {
      key: "locked",
      editableType: "select",
      options: [
        { label: "Locked", value: true },
        { label: "Unlocked", value: false },
      ],
    },
  ];
  const { can } = useAccessControl();
  const rowPermissions = {
    canEdit: can("users.update"),
    canDelete: can("users.delete"),
    canPublish: can("users.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
        {/* Header */}
        <Can permission="users.create">
          <PageHeader
            title="User List"
            addButtonText="+ Add User"
            onAddClick={() => {
              setEditUser(null);
              userFormModal.open();
            }}
          />
        </Can>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={roleOptions}
              value={filterRoleId}
              onChange={(val) => setFilterRoleId(val)}
            />
          </div>
          <SearchInput
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="users.export">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>

            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="View History"
                onClick={handleShowAllUserHistory}
              >
                <FaHistory size={18} />
                History
              </button>
            </Can>
          </div>

          <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">
                  <input
                    type="checkbox"
                    aria-label="Select all users"
                    checked={
                      selected.length > 0 && selected.length === users.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                {columns.map((col) => (
                  <TableHeader
                    key={col.key}
                    label={col.header}
                    sortKey={col.key}
                    currentKey={sortKey}
                    order={sortOrder}
                    onClick={() => handleSort(col.key)}
                    tooltip={col.tooltip}
                  />
                ))}
                <th className="table-th">Actions</th>
              </tr>
            </thead>

            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2}>
                    <DataLoading message="Loading users..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length + 2}>
                    <DataError message={error} />
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td colSpan={columns.length + 2}>
                    <DataEmpty message="No users found" />
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
                  <DataRow
                    key={user.id}
                    item={user}
                    isSelected={selected.includes(user.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditUser(data);
                      userFormModal.open();
                    }}
                    onShowHistory={handleShowAllUserHistory}
                    onInlineUpdate={handleInlineUpdate}
                    onDelete={() => handleDelete(user.id)}
                    columns={columns}
                    columnsConfig={columnsConfig}
                    highlightRow={recentlyUpdatedIds?.includes(user.id)}
                    permissions={rowPermissions}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-center items-center ">
          <Pagination
            page={page}
            totalPages={totalPages}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPageChange={handlePageChange}
          />
        </div>
        <Can permission="users.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Delete ${selected.length} selected users`}
              >
                Delete {selected.length} Selected
              </button>
            </div>
          )}
        </Can>
      </div>

      {/* Modals */}
      <CommonModal
        isOpen={userFormModal.isOpen}
        onClose={userFormModal.close}
        title={editUser ? "Edit User" : "Add User"}
      >
        <UserForm
          initialData={editUser}
          onSubmit={handleSubmit}
          roleOptions={roleOptions}
          isLoading={isSubmitting}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Are you sure you want to delete this user?"
            : `Are you sure you want to delete ${pendingDeleteIds?.length} selected users?`
        }
      />

      <ExportPreviewModal
        isOpen={exportPreviewModal.isOpen}
        onClose={exportPreviewModal.close}
        onConfirm={handleConfirmExport}
        columns={columns}
        data={exportPreview?.preview || []}
        total={exportPreview?.total || 0}
        loading={previewLoading}
      />

      <AuditLogModal
        isOpen={isLogModalOpen}
        onClose={handleCloseLogModal}
        logs={logData}
      />
    </>
  );
};

export default UserPage;
