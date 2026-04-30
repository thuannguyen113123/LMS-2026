import React, { useEffect } from "react";
import { FaHistory } from "react-icons/fa";

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
import QuestionForm from "../../components/form/Question/QuestionForm";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import useQuestions from "../../hooks/Question/useQuestions";
import Pagination from "../../components/Pagintion/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { fetchQuizOptions } from "../../features/quizzes/quizzesThunks";
import {
  selectQuizOptions,
  selectQuizOptionsLoading,
} from "../../features/quizzes/quizzesSlice";

const QuestionsPage = () => {
  const {
    questions,
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
    editQuestion,
    setEditQuestion,
    questionFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllQuestionHistory,
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
  } = useQuestions();

  const {
    sortedItems: sortedQuestions,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(questions, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("courses.update"),
    canDelete: can("courses.delete"),
    canPublish: can("courses.publish"),
  };
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchQuizOptions());
  }, [dispatch]);

  const quizOptions = useSelector(selectQuizOptions);
  const quizOptionsLoading = useSelector(selectQuizOptionsLoading);
  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="questions.create">
          <PageHeader
            title="Question List"
            addButtonText="+ Add Question"
            onAddClick={() => {
              setEditQuestion(null);
              questionFormModal.open();
            }}
          />
        </Can>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={[
                { label: "-- All Types --", value: "All" },
                { label: "Trắc nghiệm", value: "multiple_choice" },
                { label: "Tự luận", value: "essay" },
                { label: "Đúng / Sai", value: "true_false" },
              ]}
              value={filters.type}
              onChange={(val) =>
                setFilters({
                  ...filters,
                  type: val,
                })
              }
            />
          </div>

          <SearchInput
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="questions.export">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>
            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="Xem lịch sử câu hỏi"
                onClick={handleShowAllQuestionHistory}
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
                    aria-label="Chọn tất cả câu hỏi"
                    checked={
                      selected.length > 0 &&
                      selected.length === questions.length
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
                    <DataLoading message="Đang tải danh sách câu hỏi..." />
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
                    <DataEmpty message="Không có câu hỏi nào" />
                  </td>
                </tr>
              ) : (
                sortedQuestions.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditQuestion(data);
                      questionFormModal.open();
                    }}
                    onShowHistory={handleShowAllQuestionHistory}
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
                aria-label={`Xóa ${selected.length} câu hỏi đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={questionFormModal.isOpen}
        onClose={questionFormModal.close}
        title={editQuestion ? "Sửa Câu Hỏi" : "Thêm Câu Hỏi"}
        maxWidth="max-w-[60vw]"
        maxHeight="max-h-[110vh]"
      >
        <QuestionForm
          key={editQuestion?.id || editQuestion?._id || "create"}
          initialData={editQuestion}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          quizOptions={quizOptions}
          quizOptionsLoading={quizOptionsLoading}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Bạn có chắc chắn muốn xóa câu hỏi này?"
            : `Bạn có chắc chắn muốn xóa ${pendingDeleteIds?.length} câu hỏi đã chọn không?`
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

export default QuestionsPage;
