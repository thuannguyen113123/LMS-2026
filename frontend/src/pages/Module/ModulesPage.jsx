import React from "react";
import { FaHistory } from "react-icons/fa";

import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import FilterSelect from "../../components/common/FilterSelect";
import ImportExportButtons from "../../components/common/ImportExportButtons";
import DataRow from "../../components/common/DataRow";
import TableHeader from "../../components/common/TableHeader";
import CommonModal from "../../components/modal/CommonModal";
import ExportPreviewModal from "../../components/modal/ExportPreviewModal";
import AuditLogModal from "../../components/modal/AuditLogModal";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../components/common/DataStates";
import useSortableData from "../../hooks/useSortableData";
import ModuleForm from "../../components/form/Module/ModuleForm";
import ConfirmModal from "../../components/modal/ConfirmModal";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import Pagination from "../../components/Pagintion/Pagination";
import UndoSnackbar from "../../components/common/UndoSnackbar";
import useModules from "./../../hooks/Module/useModules";

const ModulesPage = () => {
  const {
    modules,
    loading,
    error,
    isEmpty,

    search,
    setSearch,
    filters,
    setFilters,

    selected,
    handleSelect,
    handleSelectAll,

    editModule,
    setEditModule,
    moduleFormModal,
    handleSubmit,
    handleToggleActive,
    handleConfirmExport,
    handleExportWithPreview,
    exportPreview,
    previewLoading,
    exportPreviewModal,

    handleShowAllModuleHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,

    columns,
    columnsConfig,
    handleInlineUpdate,

    handleDelete,
    handleDeleteSelected,
    confirmDeleteModal,
    pendingDeleteIds,
    confirmDelete,
    page,
    totalPages,
    handleNext,
    handlePrev,
    hasNext,
    hasPrev,
    handlePageChange,
    recentlyUpdatedIds,
    systemModuleOptions,
    recentlyDeleted,
    handleUndo,
    isSubmitting,
  } = useModules();

  /** =====================
   * SORT
   ====================== */
  const {
    sortedItems: sortedModules,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(modules, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("modules.update"),
    canDelete: can("modules.delete"),
    canPublish: can("modules.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="modules.create">
          <PageHeader
            title="Quản lý Module"
            addButtonText="+ Thêm module"
            onAddClick={() => {
              setEditModule(null);
              moduleFormModal.open();
            }}
          />
        </Can>
        {/* FILTER + SEARCH */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={systemModuleOptions}
              value={filters.isSystemModule}
              onChange={(val) => setFilters({ isSystemModule: val })}
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="modules.export">
              <ImportExportButtons
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>

            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1"
                title="Xem lịch sử"
                onClick={handleShowAllModuleHistory}
              >
                <FaHistory size={18} />
                Lịch sử
              </button>
            </Can>
          </div>
          <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">
                  <input
                    type="checkbox"
                    checked={
                      selected.length > 0 && selected.length === modules.length
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

                <th className="table-th">Hành động</th>
              </tr>
            </thead>

            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2}>
                    <DataLoading message="Đang tải module..." />
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
                    <DataEmpty message="Không có module nào" />
                  </td>
                </tr>
              ) : (
                sortedModules.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditModule(data);
                      moduleFormModal.open();
                    }}
                    onToggleActive={() => handleToggleActive(item)}
                    columns={columns}
                    columnsConfig={columnsConfig}
                    onInlineUpdate={handleInlineUpdate}
                    onDelete={() => handleDelete(item.id)}
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
        <Can permission="modules.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Xóa ${selected.length} khóa học đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      {/* FORM */}
      <CommonModal
        isOpen={moduleFormModal.isOpen}
        onClose={moduleFormModal.close}
        title={editModule ? "Sửa module" : "Thêm module"}
        maxWidth="max-w-[40vw]"
      >
        <ModuleForm
          initialData={editModule}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length > 0
            ? `Bạn có chắc chắn muốn xóa ${pendingDeleteIds.length} mục đã chọn không?`
            : "Bạn có chắc chắn muốn xóa danh mục này?"
        }
      />

      {/* EXPORT PREVIEW */}
      <ExportPreviewModal
        isOpen={exportPreviewModal.isOpen}
        onClose={exportPreviewModal.close}
        onConfirm={handleConfirmExport}
        columns={columns}
        data={exportPreview?.preview || []}
        total={exportPreview?.total}
        loading={previewLoading}
      />

      {/* AUDIT LOG */}
      <AuditLogModal
        isOpen={isLogModalOpen}
        onClose={handleCloseLogModal}
        logs={logData}
      />
    </>
  );
};

export default ModulesPage;
