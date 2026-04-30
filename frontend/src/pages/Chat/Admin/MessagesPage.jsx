import React from "react";

import Pagination from "../components/Pagintion/Pagination";
import CommonModal from "../components/modal/CommonModal";
import PageHeader from "../components/common/PageHeader";
import FilterSelect from "../components/common/FilterSelect";
import SearchInput from "../components/common/SearchInput";
import ImportExportButtons from "../components/common/ImportExportButtons";
import DataRow from "../components/common/DataRow";
import UndoSnackbar from "../components/common/UndoSnackbar";
import ConfirmModal from "../components/modal/ConfirmModal";

import AuditLogModal from "../components/modal/AuditLogModal";

import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../components/common/DataStates";

import { FaHistory } from "react-icons/fa";
import useMessages from "../hooks/useMessages";
import useSortableData from "../hooks/useSortableData";
import TableHeader from "../components/common/TableHeader";
import ExportPreviewModal from "../components/modal/ExportPreviewModal";
import MessageForm from "../components/form/MessageForm";
import useAccessControl from "../hooks/useAccessControl";
import Can from "../components/common/can/Can";

const MessagePage = () => {
  const {
    messages,
    columns,
    columnsConfig,
    loading,
    error,
    isEmpty,
    search,
    setSearch,
    filterType,
    setFilterType,

    selected,
    handleSelect,
    handleSelectAll,

    //handleSubmit,
    handleDelete,
    handleDeleteSelected,
    handleUndo,

    handleExportWithPreview,
    handleConfirmExport,
    previewData,

    confirmDelete,
    pendingDeleteIds,
    confirmDeleteModal,
    exportPreviewModal,

    handleShowMessageHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    logLoading,
    handleSubmit,

    handleInlineUpdate,
    recentlyUpdatedIds,
    recentlyDeleted,

    handleNext,
    handlePrev,
    page,
    hasNext,
    hasPrev,
    setEditMessage,
    editMessage,
    messageFormModal,
    totalPages,
    handlePageChange,
  } = useMessages();

  const {
    sortedItems: sortedMessages,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(messages, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("messages.update"),
    canDelete: can("messages.delete"),
    canPublish: can("messages.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="messages.create">
          {/* Header */}
          <PageHeader
            title="Message Management"
            addButtonText="+ New Message"
            onAddClick={() => alert("Tính năng tạo tin nhắn mới (admin only)")}
          />
        </Can>

        {/* Filter + Search + Export */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={[
                { label: "-- Loại tin nhắn --", value: "All" },
                { label: "Text", value: "text" },
                { label: "System", value: "system" },
                { label: "Attachment", value: "attachment" },
              ]}
              value={filterType}
              onChange={(val) => setFilterType(val)}
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm tin nhắn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="messages.export">
              <ImportExportButtons
                onImport={() => alert("Không hỗ trợ import tin nhắn")}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>
            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="Xem lịch sử chỉnh sửa"
                onClick={handleShowMessageHistory}
              >
                <FaHistory size={18} />
                Lịch sử
              </button>
            </Can>
          </div>

          <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả tin nhắn"
                    checked={
                      selected.length > 0 && selected.length === messages.length
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
                    <DataLoading message="Đang tải tin nhắn..." />
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
                    <DataEmpty message="Không có tin nhắn nào" />
                  </td>
                </tr>
              ) : (
                sortedMessages.map((msg) => (
                  <DataRow
                    key={msg.id}
                    item={msg}
                    isSelected={selected.includes(msg.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditMessage(data);
                      messageFormModal.open();
                    }}
                    onInlineUpdate={handleInlineUpdate}
                    onShowHistory={handleShowMessageHistory}
                    onDelete={() => handleDelete(msg.id)}
                    columns={columns}
                    columnsConfig={columnsConfig}
                    highlightRow={recentlyUpdatedIds?.includes(msg.id)}
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
        {/* Bulk delete */}
        <Can permission="messages.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Xóa ${selected.length} tin nhắn đã chọn`}
              >
                Xóa {selected.length} tin nhắn đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={messageFormModal.isOpen}
        onClose={messageFormModal.close}
        title={editMessage ? "Sửa Danh Mục" : "Thêm Danh Mục"}
      >
        <MessageForm initialData={editMessage} onSubmit={handleSubmit} />
      </CommonModal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Bạn có chắc chắn muốn xóa tin nhắn này?"
            : `Bạn có chắc chắn muốn xóa ${pendingDeleteIds?.length} tin nhắn đã chọn không?`
        }
      />

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={exportPreviewModal.isOpen}
        onClose={exportPreviewModal.close}
        onConfirm={handleConfirmExport}
        columns={columns}
        data={previewData}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isLogModalOpen}
        onClose={handleCloseLogModal}
        logs={logData}
        loading={logLoading}
      />
    </>
  );
};

export default MessagePage;
