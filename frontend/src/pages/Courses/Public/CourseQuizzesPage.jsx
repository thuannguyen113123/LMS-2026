import React from "react";
import { useParams } from "react-router-dom";
import { FaHistory } from "react-icons/fa";

import Pagination from "../../../components/Pagintion/Pagination";
import CommonModal from "../../../components/modal/CommonModal";
import PageHeader from "../../../components/common/PageHeader";
import FilterSelect from "../../../components/common/FilterSelect";
import SearchInput from "../../../components/common/SearchInput";
import ImportExportButtons from "../../../components/common/ImportExportButtons";
import DataRow from "../../../components/common/DataRow";
import useSortableData from "../../../hooks/useSortableData";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../../components/common/DataStates";
import UndoSnackbar from "../../../components/common/UndoSnackbar";
import ConfirmModal from "../../../components/modal/ConfirmModal";
import ExportPreviewModal from "../../../components/modal/ExportPreviewModal";
import AuditLogModal from "../../../components/modal/AuditLogModal";
import TableHeader from "../../../components/common/TableHeader";
import QuizForm from "../../../components/form/Quiz/QuizForm";
import useQuizzes from "../../../hooks/Quizz/Admin/useQuizzes";

const CourseQuizzesPage = () => {
  const { slug } = useParams();

  const {
    quizzes,
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
    previewData,
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
  } = useQuizzes(slug);

  const {
    sortedItems: sortedQuizzes,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(quizzes);

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <PageHeader
          title={`Bài kiểm tra khóa học: ${slug}`}
          addButtonText="+ Thêm bài kiểm tra"
          onAddClick={() => {
            setEditQuiz(null);
            quizFormModal.open();
          }}
        />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <SearchInput
            placeholder="Tìm kiếm bài kiểm tra..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <ImportExportButtons
              onImport={onImportExcel}
              onExportPDF={() => handleExportWithPreview("pdf")}
              onExportExcel={() => handleExportWithPreview("excel")}
            />
            <button
              className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-black"
              title="Xem lịch sử"
              onClick={handleShowAllQuizHistory}
            >
              <FaHistory size={18} />
              Lịch sử
            </button>
          </div>

          <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
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
                      quizFormModal.open();
                    }}
                    onInlineUpdate={handleInlineUpdate}
                    onDelete={() => handleDelete(item.id)}
                    columns={columns}
                    columnsConfig={columnsConfig}
                    highlightRow={recentlyUpdatedIds?.includes(item.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

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
      </div>

      <Pagination
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={hasNext}
        hasPrev={hasPrev}
        currentPage={page}
      />

      <CommonModal
        isOpen={quizFormModal.isOpen}
        onClose={quizFormModal.close}
        title={editQuiz ? "Sửa bài kiểm tra" : "Thêm bài kiểm tra"}
      >
        <QuizForm initialData={editQuiz} onSubmit={handleSubmit} courses={[]} />
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
        data={previewData}
      />

      <AuditLogModal
        isOpen={isLogModalOpen}
        onClose={handleCloseLogModal}
        logs={logData}
      />
    </>
  );
};

export default CourseQuizzesPage;
