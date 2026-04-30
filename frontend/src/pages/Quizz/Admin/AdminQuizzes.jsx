import React, { useEffect, useMemo, useState } from "react";
import { FaHistory } from "react-icons/fa";

import Pagination from "../../../components/Pagintion/Pagination";
import CommonModal from "../../../components/modal/CommonModal";
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
import AuditLogModal from "../../../components/modal/AuditLogModal";
import useSortableData from "../../../hooks/useSortableData";
import TableHeader from "../../../components/common/TableHeader";
import QuizForm from "../../../components/form/Quiz/QuizForm";
import { useDispatch, useSelector } from "react-redux";
import useAccessControl from "../../../hooks/useAccessControl";
import Can from "../../../components/common/can/Can";
import { selectCourseOptions } from "../../../features/courses/coursesSlice";
import { selectInstructorOptions } from "../../../features/instructor/instructorsSlice";
import { fetchInstructorOptions } from "../../../features/instructor/instructorsThunks";
import { fetchCourseOptions } from "../../../features/courses/coursesThunks";
import { fetchLessons } from "../../../features/lessons/lessonsThunks";
import { makeSelectLessonOptionsByCourse } from "../../../features/lessons/lessonsSlice";
import useQuizzes from "../../../hooks/Quizz/Admin/useQuizzes";

const AdminQuizzes = () => {
  const {
    quizzes,
    handleNext,
    handlePrev,
    totalPages,
    handlePageChange,
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
    editQuiz,
    setEditQuiz,
    quizFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllQuizHistory,
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
  } = useQuizzes();

  const {
    sortedItems: sortedQuizzes,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(quizzes, columns);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchInstructorOptions());
    dispatch(fetchCourseOptions());
  }, [dispatch]);

  const courseOptions = useSelector(selectCourseOptions);
  const instructorOptions = useSelector(selectInstructorOptions);
  const selectLessonOptions = useMemo(makeSelectLessonOptionsByCourse, []);

  const lessonOptions = useSelector((state) =>
    selectLessonOptions(state, selectedCourseId)
  );

  useEffect(() => {
    if (editQuiz?.course?.id) {
      setSelectedCourseId(editQuiz.course.id);
    }
  }, [editQuiz]);

  useEffect(() => {
    if (!selectedCourseId) return;

    const course = courseOptions.find((c) => c.value === selectedCourseId);

    if (course?.slug) {
      dispatch(fetchLessons({ slug: course.slug }));
    }
  }, [selectedCourseId, dispatch, courseOptions]);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("quizzes.update"),
    canDelete: can("quizzes.delete"),
    canPublish: can("quizzes.publish"),
  };

  return (
    <>
      <div className="p-6 min-h-screen">
        <Can permission="quizzes.create">
          <PageHeader
            title="Quản lý bài kiểm tra"
            addButtonText="+ Thêm bài kiểm tra"
            onAddClick={() => {
              setEditQuiz(null);
              setSelectedCourseId(null);
              quizFormModal.open();
            }}
          />
        </Can>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={courseOptions}
              value={filters.courseId}
              onChange={(val) =>
                setFilters({
                  ...filters,
                  courseId: val,
                })
              }
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm bài kiểm tra..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="quizzes.export">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>
            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1"
                title="Xem lịch sử"
                onClick={handleShowAllQuizHistory}
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
                    aria-label="Chọn tất cả bài kiểm tra"
                    checked={
                      selected.length > 0 && selected.length === quizzes.length
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
                    <DataLoading message="Đang tải danh sách bài kiểm tra..." />
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
                    <DataEmpty message="Không có bài kiểm tra nào" />
                  </td>
                </tr>
              ) : (
                sortedQuizzes.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditQuiz(data);
                      const courseId =
                        data.course?.id || data.course?._id || data.course;
                      setSelectedCourseId(courseId);
                      quizFormModal.open();
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
                aria-label={`Xóa ${selected.length} bài kiểm tra đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={quizFormModal.isOpen}
        onClose={quizFormModal.close}
        title={editQuiz ? "Sửa bài kiểm tra" : "Thêm bài kiểm tra"}
        maxWidth="max-w-[60vw]"
        maxHeight="max-h-[110vh]"
      >
        <QuizForm
          initialData={editQuiz}
          onSubmit={handleSubmit}
          courseOptions={courseOptions}
          instructorOptions={instructorOptions}
          currentUser={currentUser}
          lessonOptions={lessonOptions}
          onCourseChange={setSelectedCourseId}
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
            : "Bạn có chắc chắn muốn xóa bài kiểm tra này?"
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

export default AdminQuizzes;
