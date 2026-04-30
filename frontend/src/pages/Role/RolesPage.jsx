import React from "react";
import { FaHistory } from "react-icons/fa";

import Pagination from "../../components/Pagintion/Pagination";
import CommonModal from "../../components/modal/CommonModal";
import RoleForm from "../../components/form/role/RoleForm";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import ImportExportButtons from "../../components/common/ImportExportButtons";
import DataRow from "../../components/common/DataRow";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../components/common/DataStates";
import UndoSnackbar from "../../components/common/UndoSnackbar";
import ConfirmModal from "../../components/modal/ConfirmModal";
import ExportPreviewModal from "../../components/modal/ExportPreviewModal";
import AuditLogModal from "../../components/modal/AuditLogModal";
import useSortableData from "../../hooks/useSortableData";
import TableHeader from "../../components/common/TableHeader";
import FilterSelect from "../../components/common/FilterSelect";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import useRoles from "./../../hooks/Role/useRoles";

const RolesPage = () => {
  const {
    roles,
    handleNext,
    handlePrev,
    page,
    hasNext,
    hasPrev,
    search,
    setSearch,
    selected,
    handleSelect,
    handleSelectAll,
    handleSubmit,
    handleDelete,
    handleDeleteSelected,
    handleUndo,
    onImportExcel,
    handleExportWithPreview,
    handleConfirmExport,
    exportPreview,
    previewLoading,
    confirmDelete,
    pendingDeleteIds,
    editRole,
    setEditRole,
    roleFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllRoleHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    loading,
    error,
    isEmpty,
    columns,
    recentlyDeleted,
    columnsConfig,
    isSystemRoleOptions,
    setFilters,
    filters,
    recentlyUpdatedIds,
    totalPages,
    handlePageChange,
    isSubmitting,
  } = useRoles();

  const {
    sortedItems: sortedRoles,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(roles, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("roles.update"),
    canDelete: can("roles.delete"),
    canPublish: can("roles.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="roles.create">
          <PageHeader
            title="Role List"
            addButtonText="+ Add Role"
            onAddClick={() => {
              setEditRole(null);
              roleFormModal.open();
            }}
          />
        </Can>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={isSystemRoleOptions}
              value={filters.isSystemRole}
              onChange={(val) =>
                setFilters({
                  ...filters,
                  isSystemRole: val,
                })
              }
            />
          </div>
          <SearchInput
            placeholder="Search role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="roles.create">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>

            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="View history"
                onClick={handleShowAllRoleHistory}
              >
                <FaHistory size={18} />
                History
              </button>
            </Can>
          </div>
          <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
        </div>

        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">
                  <input
                    type="checkbox"
                    aria-label="Select all roles"
                    checked={
                      selected.length > 0 && selected.length === roles.length
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
                    <DataLoading message="Loading roles..." />
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
                    <DataEmpty message="No roles found" />
                  </td>
                </tr>
              ) : (
                sortedRoles.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditRole(data);
                      roleFormModal.open();
                    }}
                    onShowHistory={handleShowAllRoleHistory}
                    onInlineUpdate={handleInlineUpdate}
                    onDelete={() => handleDelete(item.id)}
                    columns={columns}
                    columnsConfig={columnsConfig}
                    highlightRow={recentlyUpdatedIds?.includes(item.id)}
                    permissions={rowPermissions}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
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
        <Can permission="roles.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Delete ${selected.length} selected roles`}
              >
                Delete {selected.length} selected
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={roleFormModal.isOpen}
        onClose={roleFormModal.close}
        title={editRole ? "Edit Role" : "Add Role"}
      >
        <RoleForm
          initialData={editRole}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Are you sure you want to delete this role?"
            : `Are you sure you want to delete ${pendingDeleteIds?.length} selected roles?`
        }
      />

      <ExportPreviewModal
        isOpen={exportPreviewModal.isOpen}
        onClose={exportPreviewModal.close}
        onConfirm={handleConfirmExport}
        columns={columns}
        data={exportPreview?.preview || []}
        total={exportPreview?.total}
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

export default RolesPage;
