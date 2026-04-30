import React, { useEffect } from "react";
import { FaHistory } from "react-icons/fa";

import CommonModal from "./../../components/modal/CommonModal";

import FilterSelect from "./../../components/common/FilterSelect";
import SearchInput from "./../../components/common/SearchInput";
import ImportExportButtons from "./../../components/common/ImportExportButtons";
import DataRow from "./../../components/common/DataRow";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "./../../components/common/DataStates";
import UndoSnackbar from "./../../components/common/UndoSnackbar";
import ConfirmModal from "./../../components/modal/ConfirmModal";
import ExportPreviewModal from "./../../components/modal/ExportPreviewModal";
import AuditLogModal from "./../../components/modal/AuditLogModal";
import useSortableData from "./../../hooks/useSortableData";
import TableHeader from "./../../components/common/TableHeader";
import OrderForm from "./../../components/form/OrderForm";
import useAccessControl from "./../../hooks/useAccessControl";
import Can from "./../../components/common/can/Can";
import { useDispatch, useSelector } from "react-redux";
import { selectUserOptions } from "./../../features/users/usersSlice";
import { fetchUsers } from "./../../features/users/usersThunks";
import Pagination from "./../../components/Pagintion/Pagination";
import useOrders from "./../../hooks/Order/Admin/useOrders";

const AdminOrders = () => {
  const {
    orders,
    handleNext,
    handlePrev,
    page,
    hasNext,
    hasPrev,
    totalPages,
    handlePageChange,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
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
    editOrder,
    setEditOrder,
    orderFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllOrderHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    loading,
    error,
    isEmpty,
    columns,
    recentlyDeleted,
    recentlyUpdatedIds,
    columnsConfig,
    previewColumns,
  } = useOrders();

  const {
    sortedItems: sortedOrders,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(orders, columns);

  const dispatch = useDispatch();
  const userOptions = useSelector(selectUserOptions);

  useEffect(() => {
    if (!userOptions.length) {
      dispatch(fetchUsers());
    }
  }, [dispatch, userOptions.length]);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("orders.update"),
    canDelete: can("orders.delete"),
    canPublish: can("orders.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
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
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="orders.export">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>
            <Can permission="auditlogs.read">
              <button
                className="flex items-center gap-1 px-2 py-1 "
                title="Xem lịch sử đơn hàng"
                onClick={handleShowAllOrderHistory}
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
                    aria-label="Chọn tất cả đơn hàng"
                    checked={
                      selected.length > 0 && selected.length === orders.length
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
                    <DataLoading message="Đang tải danh sách đơn hàng..." />
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
                    <DataEmpty message="Không có đơn hàng nào" />
                  </td>
                </tr>
              ) : (
                sortedOrders.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditOrder(data);
                      orderFormModal.open();
                    }}
                    onShowHistory={handleShowAllOrderHistory}
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
        <Can permission="orders.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Xóa ${selected.length} đơn hàng đã chọn`}
              >
                Xóa {selected.length} đơn hàng đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={orderFormModal.isOpen}
        onClose={orderFormModal.close}
        title={editOrder ? "Sửa Đơn Hàng" : "Thêm Đơn Hàng"}
      >
        <OrderForm
          initialData={editOrder}
          onSubmit={handleSubmit}
          users={userOptions}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Bạn có chắc chắn muốn xóa đơn hàng này?"
            : `Bạn có chắc chắn muốn xóa ${pendingDeleteIds?.length} đơn hàng đã chọn không?`
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

export default AdminOrders;
