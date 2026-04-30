import React from "react";
import { FaHistory } from "react-icons/fa";

import Pagination from "../../components/Pagintion/Pagination";
import CommonModal from "../../components/modal/CommonModal";
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
import PermissionForm from "../../components/form/PermissionForm";
import useSortableData from "../../hooks/useSortableData";
import TableHeader from "../../components/common/TableHeader";
import FilterSelect from "../../components/common/FilterSelect";
import Can from "../../components/common/can/Can";
import useAccessControl from "../../hooks/useAccessControl";
import { useSelector } from "react-redux";
import { selectModuleOptions } from "../../features/modules/modulesSlice";
import usePermissions from "./../../hooks/Permission/usePermissions";

const PermissionsPage = () => {
  const {
    permissions,
    loading,
    error,
    isEmpty,
    page,
    hasNext,
    hasPrev,
    totalPages,
    handleNext,
    handlePageChange,
    handlePrev,

    search,
    setSearch,

    selected,
    handleSelect,
    handleSelectAll,

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

    editPermission,
    setEditPermission,
    permissionFormModal,
    confirmDeleteModal,
    exportPreviewModal,

    handleSubmit,
    handleInlineUpdate,

    handleShowAllPermissionHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,

    columns,
    columnsConfig,
    recentlyUpdatedIds,
    recentlyDeleted,
    filterCategory,
    setFilterCategory,
    categoryOptions,
    isSubmitting,
  } = usePermissions();

  const {
    sortedItems: sortedPermissions,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(permissions);
  const moduleOptions = useSelector(selectModuleOptions);
  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("permissions.update"),
    canDelete: can("permissions.delete"),
    canPublish: can("courses.publish"),
  };

  return (
    <>
      <div className="p-6 min-h-screen">
        <Can permission="permissions.create">
          <PageHeader
            title="Permission List"
            addButtonText="+ Add Permission"
            onAddClick={() => {
              setEditPermission(null);
              permissionFormModal.open();
            }}
          />
        </Can>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={categoryOptions}
              value={filterCategory}
              onChange={(val) => setFilterCategory(val)}
            />
          </div>
          <SearchInput
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="permissions.create">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>
            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="Xem lịch sử"
                onClick={handleShowAllPermissionHistory}
              >
                <FaHistory size={18} />
                Lịch sử
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
                    aria-label="Chọn tất cả"
                    checked={
                      selected.length > 0 &&
                      selected.length === permissions.length
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
                    <DataLoading message="Đang tải danh sách quyền..." />
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
                    <DataEmpty message="Không có quyền nào." />
                  </td>
                </tr>
              ) : (
                sortedPermissions.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditPermission(data);
                      permissionFormModal.open();
                    }}
                    onShowHistory={handleShowAllPermissionHistory}
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
        <Can permission="courses.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Xóa ${selected.length} quyền đã chọn`}
              >
                Xóa {selected.length} quyền đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={permissionFormModal.isOpen}
        onClose={permissionFormModal.close}
        title={editPermission ? "Sửa Quyền" : "Thêm Quyền"}
      >
        <PermissionForm
          initialData={editPermission}
          onSubmit={handleSubmit}
          moduleOptions={moduleOptions}
          isLoading={isSubmitting}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Bạn có chắc chắn muốn xóa quyền này?"
            : `Bạn có chắc chắn muốn xóa ${pendingDeleteIds?.length} quyền đã chọn không?`
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

export default PermissionsPage;
