import React from "react";

import Pagination from "../../components/Pagintion/Pagination";
import CommonModal from "../../components/modal/CommonModal";
import DiscountForm from "../../components/form/DiscountForm";
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

import useSortableData from "../../hooks/useSortableData";
import TableHeader from "../../components/common/TableHeader";

import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import useDiscounts from "./../../hooks/Discount/useDiscounts";

const DiscountPage = () => {
  const {
    discounts,
    page,
    totalPages,
    hasNext,
    hasPrev,
    handlePageChange,
    handleNext,
    handlePrev,
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
    editDiscount,
    setEditDiscount,
    discountFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    loading,
    error,
    isEmpty,
    columns,
    recentlyDeleted,
    typeFilterOptions,
    statusFilterOptions,
    columnsConfig,
    recentlyUpdatedIds,
    handleInlineUpdate,
    previewColumns,
    isSubmitting,
  } = useDiscounts();

  const {
    sortedItems: sortedDiscounts,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(discounts, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("discounts.update"),
    canDelete: can("discounts.delete"),
    canPublish: can("discounts.publish"),
  };

  return (
    <>
      <div className="p-6  min-h-screen">
        <PageHeader
          title="Quản lý mã giảm giá"
          addButtonText="+ Thêm mã giảm giá"
          onAddClick={() => {
            setEditDiscount(null);
            discountFormModal.open();
          }}
        />

        {/* FILTER + SEARCH + EXPORT/IMPORT */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              label="Loại giảm giá"
              options={typeFilterOptions}
              value={filters.type}
              onChange={(val) =>
                setFilters({
                  ...filters,
                  type: val,
                })
              }
            />

            <FilterSelect
              label="Trạng thái"
              options={statusFilterOptions}
              value={filters.isActive}
              onChange={(val) =>
                setFilters({
                  ...filters,
                  isActive: val,
                })
              }
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm mã giảm giá..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="discounts.export">
              <ImportExportButtons
                onImport={onImportExcel}
                onExportPDF={() => handleExportWithPreview("pdf")}
                onExportExcel={() => handleExportWithPreview("excel")}
              />
            </Can>
          </div>

          <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả mã giảm giá"
                    checked={
                      selected.length > 0 &&
                      selected.length === discounts.length
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
                    <DataLoading message="Đang tải mã giảm giá..." />
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
                    <DataEmpty message="Không có mã giảm giá nào" />
                  </td>
                </tr>
              ) : (
                sortedDiscounts.map((item) => (
                  <DataRow
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onSelect={handleSelect}
                    onEdit={(data) => {
                      setEditDiscount(data);
                      discountFormModal.open();
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
        {/* PAGINATION */}
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
        {/* DELETE SELECTED */}
        <Can permission="courses.delete">
          {selected.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelected}
                aria-label={`Xóa ${selected.length} mã giảm giá đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      {/* MODALS */}
      <CommonModal
        isOpen={discountFormModal.isOpen}
        onClose={discountFormModal.close}
        title={editDiscount ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}
      >
        <DiscountForm
          initialData={editDiscount}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          selected?.length > 0
            ? `Bạn có chắc chắn muốn xóa ${selected.length} mã giảm giá đã chọn không?`
            : "Bạn có chắc chắn muốn xóa mã giảm giá này?"
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
    </>
  );
};

export default DiscountPage;
