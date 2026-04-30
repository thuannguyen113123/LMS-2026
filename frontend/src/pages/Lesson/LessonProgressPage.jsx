import React from "react";

import Pagination from "../../components/Pagintion/Pagination";
import TableHeader from "../../components/common/TableHeader";
import DataRow from "../../components/common/DataRow";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../components/common/DataStates";
import useSortableData from "../../hooks/useSortableData";
import FilterSelect from "../../components/common/FilterSelect";
import LessonProgressDetailModal from "../../components/modal/LessonProgressDetailModal";
import ConfirmModal from "../../components/modal/ConfirmModal";
import useLessonProgressManager from "./../../hooks/LessonProgress/Admin/useLessonProgressManager";

const LessonProgressPage = () => {
  const {
    progresses,
    columns,
    loading,
    errorCode,
    isEmpty,
    page,
    totalPages,
    handleNext,
    handlePrev,
    handlePageChange,
    statusOptions,
    filters,
    setFilters,
    detail,
    detailLoading,
    isDetailModalOpen,
    handleOpenDetail,
    handleCloseDetail,
    handleResetProgress,
    confirmResetModal,

    confirmReset,
    closeResetModal,
  } = useLessonProgressManager();

  const { sortedItems, sortKey, sortOrder, handleSort } = useSortableData(
    progresses,
    columns
  );

  return (
    <div className="p-6  min-h-screen">
      <h1 className="text-xl font-semibold mb-4">Quản lý tiến độ học tập</h1>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <FilterSelect
          options={statusOptions}
          value={filters.status}
          onChange={(val) =>
            setFilters({
              ...filters,
              status: val,
            })
          }
        />
      </div>

      <div className="overflow-x-auto bg-card rounded-lg shadow">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th className="table-th"></th>
              {columns.map((col) => (
                <TableHeader
                  key={col.key}
                  label={col.header}
                  sortKey={col.key}
                  currentKey={sortKey}
                  order={sortOrder}
                  onClick={() => handleSort(col.key)}
                />
              ))}
              <th className="table-th">Hành động</th>
            </tr>
          </thead>

          <tbody className="table-body">
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <DataLoading message="Đang tải dữ liệu..." />
                </td>
              </tr>
            ) : errorCode ? (
              <tr>
                <td colSpan={columns.length}>
                  <DataError message="Không thể tải dữ liệu" />
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length}>
                  <DataEmpty message="Không có dữ liệu tiến độ" />
                </td>
              </tr>
            ) : (
              sortedItems.map((item) => (
                <DataRow
                  key={item.id}
                  item={item}
                  columns={columns}
                  permissions={{}}
                  onViewDetails={() => handleOpenDetail(item.id)}
                  onResetProgress={() => handleResetProgress(item.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6">
        <Pagination
          page={page}
          totalPages={totalPages}
          onNext={handleNext}
          onPrev={handlePrev}
          onPageChange={handlePageChange}
          hasNext={page < totalPages}
          hasPrev={page > 1}
        />
      </div>
      <LessonProgressDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        detail={detail}
        loading={detailLoading}
      />
      <ConfirmModal
        isOpen={confirmResetModal}
        onClose={closeResetModal}
        onConfirm={confirmReset}
        message="Bạn có chắc chắn muốn reset tiến độ bài học này? Hành động này không thể hoàn tác."
        confirmText="Reset"
      />
    </div>
  );
};

export default LessonProgressPage;
