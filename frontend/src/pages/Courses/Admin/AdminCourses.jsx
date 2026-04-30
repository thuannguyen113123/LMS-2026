import React, { useEffect } from "react";

import Pagination from "../../../components/Pagintion/Pagination";
import CommonModal from "../../../components/modal/CommonModal";
import CourseForm from "../../../components/form/Course/CourseForm";
import PageHeader from "../../../components/common/PageHeader";
import FilterSelect from "../../../components/common/FilterSelect";
import SearchInput from "../../../components/common/SearchInput";
import ImportExportButtons from "../../../components/common/ImportExportButtons";
import DataRow from "../../../components/common/DataRow";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../../components/common/DataStates";
import UndoSnackbar from "../../../components/common/UndoSnackbar";
import ConfirmModal from "../../../components/modal/ConfirmModal";
import ExportPreviewModal from "../../../components/modal/ExportPreviewModal";
import { FaHistory } from "react-icons/fa";
import AuditLogModal from "../../../components/modal/AuditLogModal";
import useSortableData from "../../../hooks/useSortableData";
import TableHeader from "../../../components/common/TableHeader";
import { useDispatch, useSelector } from "react-redux";
import { publishCourse } from "../../../features/courses/coursesThunks";
import Can from "../../../components/common/can/Can";
import useAccessControl from "../../../hooks/useAccessControl";
import {
  selectCategoryFilterOptions,
  selectCategoryOptions,
} from "../../../features/category/categoriesSlice";
import { selectInstructorOptions } from "../../../features/instructor/instructorsSlice";
import { fetchInstructorOptions } from "../../../features/instructor/instructorsThunks";
import useCourses from "./../../../hooks/Course/Admin/useCourses";
import { fetchCategoryOptions } from "../../../features/category/categoriesThunks";

const AdminCourses = () => {
  const {
    courses,
    page,
    totalPages,
    handleNext,
    handlePrev,
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
    editCourse,
    setEditCourse,
    courseFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllCourseHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    loading,
    error,
    isEmpty,
    columns,

    columnsConfig,
    recentlyUpdatedIds,
    filters,
    setFilters,
    handlePageChange,
    recentlyDeleted,
    isSubmitting,
  } = useCourses();

  const dispatch = useDispatch();

  const instructorOptions = useSelector(selectInstructorOptions);
  const categoryOptions = useSelector(selectCategoryOptions);

  useEffect(() => {
    dispatch(fetchInstructorOptions());
    dispatch(fetchCategoryOptions());
  }, [dispatch]);
  const categoryOptionsFilter = useSelector(selectCategoryFilterOptions);

  const {
    sortedItems: sortedCourses,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(courses, columns);
  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("courses.update"),
    canDelete: can("courses.delete"),
    canPublish: can("courses.publish"),
  };
  const canAssignInstructor = can("courses.assignInstructor");

  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="courses.create">
          <PageHeader
            title="Quản lý khóa học"
            addButtonText="+ Thêm khóa học"
            onAddClick={() => {
              setEditCourse(null);
              courseFormModal.open();
            }}
          />
        </Can>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={categoryOptionsFilter}
              value={filters.category}
              onChange={(val) =>
                setFilters({
                  ...filters,
                  category: val,
                })
              }
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="courses.export">
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
                onClick={handleShowAllCourseHistory}
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
                    aria-label="Chọn tất cả khóa học"
                    checked={
                      selected.length > 0 && selected.length === courses.length
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
                    <DataLoading message="Đang tải khóa học..." />
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
                    <DataEmpty message="Không có khóa học nào" />
                  </td>
                </tr>
              ) : (
                sortedCourses.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditCourse(data);
                      courseFormModal.open();
                    }}
                    onInlineUpdate={handleInlineUpdate}
                    onDelete={() => handleDelete(item.id)}
                    onPublish={(id) => dispatch(publishCourse(id))}
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
                aria-label={`Xóa ${selected.length} khóa học đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={courseFormModal.isOpen}
        onClose={courseFormModal.close}
        title={editCourse ? "Sửa khóa học" : "Thêm khóa học"}
        maxWidth="max-w-[60vw]"
        maxHeight="max-h-[110vh]"
      >
        <CourseForm
          key={editCourse ? editCourse.id : "create"} // ⭐ FIX
          initialData={editCourse}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          categoryOptions={categoryOptions}
          instructorOptions={instructorOptions}
          allowInstructorSelect={canAssignInstructor}
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

export default AdminCourses;
