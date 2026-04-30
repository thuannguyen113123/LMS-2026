import React from "react";
import { FaHistory } from "react-icons/fa";

import Pagination from "../../components/Pagintion/Pagination";
import CommonModal from "../../components/modal/CommonModal";
import PageHeader from "../../components/common/PageHeader";
import FilterSelect from "../../components/common/FilterSelect";
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
import InstructorForm from "../../components/form/InstructorsForm";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import useInstructors from "../../hooks/Instructor/Admin/useInstructors";

const InstructorsPage = () => {
  const {
    instructors,
    handleNext,
    handlePrev,
    handlePageChange,
    page,
    hasNext,
    hasPrev,
    totalPages,
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
    editInstructor,
    setEditInstructor,
    instructorFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllInstructorHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    loading,
    error,
    isEmpty,
    columns,
    recentlyDeleted,
    expertiseOptions,
    columnsConfig,
    recentlyUpdatedIds,
    users,
    filters,
    handleSelectExpertise,
    previewColumns,
    isSubmitting,
  } = useInstructors();

  const {
    sortedItems: sortedInstructors,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(instructors, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("instructors.update"),
    canDelete: can("instructors.delete"),
    canPublish: can("instructors.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="instructors.create">
          <PageHeader
            title="Quản lý giảng viên"
            addButtonText="+ Thêm giảng viên"
            onAddClick={() => {
              setEditInstructor(null);
              instructorFormModal.open();
            }}
          />
        </Can>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={expertiseOptions}
              value={filters.expertise}
              onChange={handleSelectExpertise}
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm giảng viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="caterories.create">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>

            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="Xem lịch sử thay đổi giảng viên"
                onClick={handleShowAllInstructorHistory}
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
                    aria-label="Chọn tất cả giảng viên"
                    checked={
                      selected.length > 0 &&
                      selected.length === instructors.length
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
                    <DataLoading message="Đang tải danh sách giảng viên..." />
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
                    <DataEmpty message="Không có giảng viên nào" />
                  </td>
                </tr>
              ) : (
                sortedInstructors.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      console.log("Edit instructor data:", data);
                      setEditInstructor(data);
                      instructorFormModal.open();
                    }}
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
                aria-label={`Xóa ${selected.length} giảng viên đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={instructorFormModal.isOpen}
        onClose={instructorFormModal.close}
        title={editInstructor ? "Sửa thông tin giảng viên" : "Thêm giảng viên"}
      >
        <InstructorForm
          initialData={editInstructor}
          onSubmit={handleSubmit}
          users={users || []}
          mode={editInstructor ? "edit" : "create"}
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
            : "Bạn có chắc chắn muốn xóa giảng viên này?"
        }
      />

      <ExportPreviewModal
        isOpen={exportPreviewModal.isOpen}
        onClose={exportPreviewModal.close}
        onConfirm={handleConfirmExport}
        columns={previewColumns}
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

export default InstructorsPage;
