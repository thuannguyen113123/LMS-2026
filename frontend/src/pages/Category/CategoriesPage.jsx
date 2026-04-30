import React from "react";

import Pagination from "../../components/Pagintion/Pagination";
import CommonModal from "../../components/modal/CommonModal";
import CategoryForm from "../../components/form/CategoryForm";
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
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import CategoryCardList from "../../components/common/category/CategoryCardList";
import useCategories from "./../../hooks/Category/useCategories";

const CategoriesPage = () => {
  const {
    categories,
    handleNext,
    handlePrev,
    page,
    hasNext,
    hasPrev,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    selected,
    handleSelect,
    handleSelectAll,
    handleSubmit,
    handleDelete,
    handleDeleteSelected,
    handleUndo,
    onImportExcel,

    isRecentlyUpdatedByData,

    handleExportWithPreview,
    handleConfirmExport,
    exportPreview,
    previewLoading,
    confirmDelete,
    pendingDeleteIds,
    editCategory,
    setEditCategory,
    categoryFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleInlineUpdate,
    handleShowAllCategoryHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    loading,
    error,
    isEmpty,
    columns,
    recentlyDeleted,

    columnsConfig,

    categoryOptions,
    totalPages,
    handlePageChange,
    recentlyUpdatedIds,
    isSubmitting,
    visibleColumns,
    isMobile,
    deleteLoading,
  } = useCategories();

  const {
    sortedItems: sortedcategories,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(categories, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("categories.update"),
    canDelete: can("categories.delete"),
  };

  return (
    <>
      <div className="min-h-screen px-3 py-4 ">
        <Can permission="categories.create">
          <PageHeader
            title="Category List"
            addButtonText="+ Add Category"
            onAddClick={() => {
              setEditCategory(null);
              categoryFormModal.open();
            }}
          />
        </Can>
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between mb-4">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={categoryOptions}
              value={filterCategory || "All"}
              onChange={(val) => setFilterCategory(val)}
            />
          </div>

          <SearchInput
            placeholder="Search category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-60 lg:w-[300px] xl:w-[340px]"
          />

          <div className="flex items-center gap-2">
            <Can permission="categories.create">
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
                onClick={handleShowAllCategoryHistory}
              >
                <FaHistory size={18} />
                Lịch sử
              </button>
            </Can>
          </div>
          <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
        </div>
        {isMobile ? (
          // 📱 MOBILE → CARD
          <>
            {loading ? (
              <DataLoading message="Đang tải danh mục..." />
            ) : error ? (
              <DataError message={error} />
            ) : isEmpty ? (
              <DataEmpty message="Không có danh mục nào" />
            ) : (
              <CategoryCardList
                data={sortedcategories}
                onEdit={(item) => {
                  setEditCategory(item);
                  categoryFormModal.open();
                }}
                onDelete={(id) => handleDelete(id)}
              />
            )}
          </>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-card -mx-3 sm:mx-0">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-th">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả danh mục"
                      checked={
                        selected.length > 0 &&
                        selected.length === categories.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  {visibleColumns.map((col) => (
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
                    <td colSpan={visibleColumns.length + 2}>
                      <DataLoading message="Đang tải danh mục..." />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 2}>
                      <DataError message={error} />
                    </td>
                  </tr>
                ) : isEmpty ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 2}>
                      <DataEmpty message="Không có danh mục nào" />
                    </td>
                  </tr>
                ) : (
                  sortedcategories.map((item) => (
                    <DataRow
                      key={item.id}
                      item={item}
                      isSelected={selected.includes(item.id)}
                      onSelect={handleSelect}
                      onEdit={(data) => {
                        setEditCategory(data);
                        categoryFormModal.open();
                      }}
                      onShowHistory={handleShowAllCategoryHistory}
                      onInlineUpdate={handleInlineUpdate}
                      onDelete={() => handleDelete(item.id)}
                      columns={visibleColumns}
                      columnsConfig={columnsConfig}
                      isRecentlyUpdatedByData={isRecentlyUpdatedByData}
                      highlightRow={recentlyUpdatedIds?.includes(item.id)}
                      permissions={rowPermissions}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-center items-center px-3 sm:px-0">
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
                aria-label={`Xóa ${selected.length} danh mục đã chọn`}
              >
                Xóa {selected.length} mục đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      <CommonModal
        isOpen={categoryFormModal.isOpen}
        onClose={categoryFormModal.close}
        title={editCategory ? "Sửa Danh Mục" : "Thêm Danh Mục"}
      >
        <CategoryForm
          initialData={editCategory}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </CommonModal>

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        isLoading={deleteLoading}
        message={
          pendingDeleteIds?.length === 1
            ? "Bạn có chắc chắn muốn xóa danh mục này?"
            : `Bạn có chắc chắn muốn xóa ${pendingDeleteIds?.length} mục đã chọn không?`
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

export default CategoriesPage;
