import React from "react";
import { FaHistory } from "react-icons/fa";

import Pagination from "../../components/Pagintion/Pagination";
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
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import useComments from "./../../hooks/Comment/useComments";

const CommentsPage = () => {
  const {
    comments,
    handleNext,
    handlePrev,
    totalPages,
    handlePageChange,
    page,
    hasNext,
    hasPrev,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
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

    confirmDeleteModal,
    exportPreviewModal,

    handleShowAllCommentHistory,
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
  } = useComments();

  const {
    sortedItems: sortedComments,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(comments, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("comments.update"),
    canDelete: can("comments.delete"),
    canPublish: can("comments.publish"),
  };

  return (
    <>
      <div className="p-6 min-h-screen">
        <Can permission="comments.create">
          <PageHeader title="Comment List" />
        </Can>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={[
                { label: "-- Tất cả --", value: "" },
                { label: "Mới nhất (7 ngày)", value: "recent" },
                { label: "Nổi bật", value: "hotOnly" },
                { label: "Bị báo cáo", value: "reported" },
              ]}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
            />
          </div>

          <SearchInput
            placeholder="Search comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="comments.export">
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
                onClick={handleShowAllCommentHistory}
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
                    aria-label="Chọn tất cả bình luận"
                    checked={
                      selected.length > 0 && selected.length === comments.length
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
                    <DataLoading message="Đang tải bình luận..." />
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
                    <DataEmpty message="Không có bình luận nào" />
                  </td>
                </tr>
              ) : (
                sortedComments.map((item, index) => (
                  <DataRow
                    key={index}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onShowHistory={handleShowAllCommentHistory}
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
                aria-label={`Xóa ${selected.length} bình luận đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Bạn có chắc chắn muốn xóa bình luận này?"
            : `Bạn có chắc chắn muốn xóa ${pendingDeleteIds?.length} bình luận đã chọn không?`
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

export default CommentsPage;
