import React from "react";
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
import { FaHistory } from "react-icons/fa";
import AuditLogModal from "../../components/modal/AuditLogModal";
import useSortableData from "../../hooks/useSortableData";
import TableHeader from "../../components/common/TableHeader";

import usePayments from "../../hooks/Payment/usePayments";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";

const PaymentPage = () => {
  const {
    payments,
    handleNext,
    handlePrev,
    page,
    hasNext,
    hasPrev,
    handlePageChange,
    totalPages,
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
    handleInlineUpdate,
    handleShowAllPaymentHistory,
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
    previewColumns,
  } = usePayments();

  const {
    sortedItems: sortedPayments,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(payments, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("payments.update"),
    canDelete: can("payments.delete"),
    canPublish: can("payments.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
        <Can permission="payments.create">
          <PageHeader title="Payment Transactions" />
        </Can>

        {/* Bộ lọc và tìm kiếm */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={[
                { label: "-- Tất cả trạng thái --", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Paid", value: "paid" },
                { label: "Cancelled", value: "cancelled" },
              ]}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
            />
          </div>

          <SearchInput
            placeholder="Tìm theo mã giao dịch hoặc người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="payment.export">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>
            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="Xem lịch sử thanh toán"
                onClick={handleShowAllPaymentHistory}
              >
                <FaHistory size={18} />
                Lịch sử
              </button>
            </Can>
          </div>

          <UndoSnackbar count={recentlyDeleted?.length} onUndo={handleUndo} />
        </div>

        {/* Bảng giao dịch */}
        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả giao dịch"
                    checked={
                      selected?.length > 0 &&
                      selected.length === payments.length
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
                    <DataLoading message="Đang tải danh sách thanh toán..." />
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
                    <DataEmpty message="Không có giao dịch nào" />
                  </td>
                </tr>
              ) : (
                sortedPayments.map((item) => (
                  <DataRow
                    key={item._id || item.id}
                    item={item}
                    isSelected={selected.includes(item._id || item.id)}
                    onSelect={handleSelect}
                    onShowHistory={handleShowAllPaymentHistory}
                    onInlineUpdate={handleInlineUpdate}
                    onDelete={() => handleDelete(item._id || item.id)}
                    columns={columns}
                    columnsConfig={columnsConfig}
                    highlightRow={recentlyUpdatedIds?.includes(
                      item._id || item.id
                    )}
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

        {/* Nút xóa nhiều */}
        <Can permission="payments.delete">
          {selected?.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Xóa ${selected.length} giao dịch đã chọn`}
              >
                Xóa {selected.length} giao dịch
              </button>
            </div>
          )}
        </Can>
      </div>

      {/* Phân trang */}

      {/* Modal xác nhận xóa */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Bạn có chắc chắn muốn xóa giao dịch này?"
            : `Bạn có chắc chắn muốn xóa ${pendingDeleteIds?.length} giao dịch đã chọn không?`
        }
      />

      {/* Modal xem trước xuất file */}
      <ExportPreviewModal
        isOpen={exportPreviewModal.isOpen}
        onClose={exportPreviewModal.close}
        onConfirm={handleConfirmExport}
        columns={previewColumns}
        data={exportPreview?.preview || []}
        total={exportPreview?.total}
        loading={previewLoading}
      />

      {/* Modal lịch sử thanh toán */}
      <AuditLogModal
        isOpen={isLogModalOpen}
        onClose={handleCloseLogModal}
        logs={logData}
      />
    </>
  );
};

export default PaymentPage;
