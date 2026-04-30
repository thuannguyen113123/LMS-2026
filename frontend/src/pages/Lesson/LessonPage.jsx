import React, { useEffect } from "react";
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
import LessonForm from "../../components/form/Lesson/LessonForm";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import { selectCourseOptions } from "../../features/courses/coursesSlice";
import { useDispatch, useSelector } from "react-redux";
import useLessons from "./../../hooks/Lesson/Admin/useLessons";
import { fetchCourseOptions } from "../../features/courses/coursesThunks";

const LessonPage = () => {
  const {
    lessons,
    totalPages,
    handlePageChange,
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
    previewLoading,
    exportPreview,
    confirmDelete,
    pendingDeleteIds,
    editLesson,
    setEditLesson,
    lessonFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllLessonHistory,
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
    filters,
    setFilters,
    isSubmitting,
  } = useLessons();

  const {
    sortedItems: sortedLessons,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(lessons, columns);

  const dispatch = useDispatch();

  const courseOptions = useSelector(selectCourseOptions);

  useEffect(() => {
    dispatch(fetchCourseOptions());
  }, [dispatch]);

  const { can } = useAccessControl();
  const rowPermissions = {
    canEdit: can("lessons.update"),
    canDelete: can("lessons.delete"),
    canPublish: can("lessons.publish"),
  };
  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="courses.create">
          <PageHeader
            title="Quản lý bài học"
            addButtonText="+ Thêm bài học"
            onAddClick={() => {
              setEditLesson(null);
              lessonFormModal.open();
            }}
          />
        </Can>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={courseOptions}
              value={filters.course}
              onChange={(val) =>
                setFilters({
                  ...filters,
                  course: val,
                })
              }
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm bài học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="lessons.create">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>

            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="Xem lịch sử thay đổi bài học"
                onClick={handleShowAllLessonHistory}
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
                    aria-label="Chọn tất cả bài học"
                    checked={
                      selected.length > 0 && selected.length === lessons.length
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
                    <DataLoading message="Đang tải danh sách bài học..." />
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
                    <DataEmpty message="Chưa có bài học nào" />
                  </td>
                </tr>
              ) : (
                sortedLessons.map((item, index) => (
                  <DataRow
                    key={item.id || index}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditLesson(data);
                      lessonFormModal.open();
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
        <Can permission="lessons.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Xóa ${selected.length} bài học đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={lessonFormModal.isOpen}
        onClose={lessonFormModal.close}
        title={editLesson ? "Sửa bài học" : "Thêm bài học"}
        maxWidth="max-w-[60vw]"
        maxHeight="max-h-[110vh]"
      >
        <LessonForm
          initialData={editLesson}
          onSubmit={handleSubmit}
          courseOptions={courseOptions}
          isLoading={isSubmitting}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length > 0
            ? `Bạn có chắc chắn muốn xóa ${pendingDeleteIds.length} bài học đã chọn không?`
            : "Bạn có chắc chắn muốn xóa bài học này?"
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

export default LessonPage;
