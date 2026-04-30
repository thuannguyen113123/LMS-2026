import React from "react";

import Pagination from "../../components/Pagintion/Pagination";
import CommonModal from "../../components/modal/CommonModal";

import PageHeader from "../../components/common/PageHeader";
import FilterSelect from "../../components/common/FilterSelect";
import SearchInput from "../../components/common/SearchInput";
import ImportExportButtons from "../../components/common/ImportExportButtons";
import DataRow from "../../components/common/DataRow";

import useStudents from "../../hooks/Student/useStudents";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../components/common/DataStates";
import UndoSnackbar from "../../components/common/UndoSnackbar";
import ConfirmModal from "../../components/modal/ConfirmModal";
import ExportPreviewModal from "../../components/modal/ExportPreviewModal";

import { FaHistory } from "react-icons/fa";
import AuditLogModal from "../../components/modal/AuditLogModal";
import useSortableData from "../../hooks/useSortableData";
import TableHeader from "../../components/common/TableHeader";
import StudentForm from "../../components/form/student/StudentForm";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";

const StudentsPage = () => {
  const {
    students,
    handleNext,
    handlePrev,
    page,
    totalPages,
    handlePageChange,
    hasNext,
    hasPrev,
    search,
    setSearch,
    filters,
    setFilters,
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
    editStudent,
    setEditStudent,
    studentFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllStudentHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    loading,
    error,
    isEmpty,
    columns,
    recentlyDeleted,
    columnsConfig,
    recentlyUpdatedIds,
    users,
    isSubmitting,
  } = useStudents();

  const {
    sortedItems: sortedStudents,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(students, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("students.update"),
    canDelete: can("students.delete"),
    canPublish: can("students.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="students.create">
          <PageHeader
            title="Quản lý học viên"
            addButtonText="+ Thêm học viên"
            onAddClick={() => {
              setEditStudent(null);
              studentFormModal.open();
            }}
          />
        </Can>
        {/* Bộ lọc & tìm kiếm */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={[
                { label: "All", value: "all" },
                { label: "Vietnamese", value: "vi" },
                { label: "English", value: "en" },
              ]}
              value={filters.language}
              onChange={(val) => setFilters({ language: val })}
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm học viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="students.create">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>

            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="Xem lịch sử thay đổi học viên"
                onClick={handleShowAllStudentHistory}
              >
                <FaHistory size={18} />
                Lịch sử
              </button>
            </Can>
          </div>

          <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
        </div>

        {/* Bảng danh sách */}
        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả học viên"
                    checked={
                      selected.length > 0 && selected.length === students.length
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
                    <DataLoading message="Đang tải danh sách học viên..." />
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
                    <DataEmpty message="Không có học viên nào" />
                  </td>
                </tr>
              ) : (
                sortedStudents.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditStudent(data);
                      studentFormModal.open();
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
        {/* PHÂN TRANG */}
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
        <Can permission="students.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Xóa ${selected.length} học viên đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      {/* FORM HỌC VIÊN */}
      <CommonModal
        isOpen={studentFormModal.isOpen}
        onClose={studentFormModal.close}
        title={editStudent ? "Sửa thông tin học viên" : "Thêm học viên"}
      >
        <StudentForm
          initialData={editStudent}
          onSubmit={handleSubmit}
          users={users}
          isLoading={isSubmitting}
        />
      </CommonModal>

      {/* XÁC NHẬN XÓA */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length > 0
            ? `Bạn có chắc chắn muốn xóa ${pendingDeleteIds.length} mục đã chọn không?`
            : "Bạn có chắc chắn muốn xóa học viên này?"
        }
      />

      {/* XEM TRƯỚC EXPORT */}

      <ExportPreviewModal
        isOpen={exportPreviewModal.isOpen}
        onClose={exportPreviewModal.close}
        onConfirm={handleConfirmExport}
        columns={columns}
        data={exportPreview?.preview || []}
        total={exportPreview?.total}
        loading={previewLoading}
      />

      {/* LỊCH SỬ THAY ĐỔI */}
      <AuditLogModal
        isOpen={isLogModalOpen}
        onClose={handleCloseLogModal}
        logs={logData}
      />
    </>
  );
};

export default StudentsPage;
