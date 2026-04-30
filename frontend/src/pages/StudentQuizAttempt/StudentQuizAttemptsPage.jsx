import React from "react";

import Pagination from "../../components/Pagintion/Pagination";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import DataRow from "../../components/common/DataRow";
import TableHeader from "../../components/common/TableHeader";
import useSortableData from "../../hooks/useSortableData";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../components/common/DataStates";
import AttemptDetailModal from "../../components/modal/AttemptDetailModal";
import useStudentQuizAttempts from "../../hooks/StudentQuizAttempt/useStudentQuizAttempts";

const StudentQuizAttemptsPage = ({ studentId = "", quizId = "" }) => {
  const {
    attempts,
    loading,
    error,
    columns,
    search,
    setSearch,
    page,
    hasNext,
    hasPrev,
    handleNext,
    handlePrev,
    totalPages,
    handlePageChange,
    attemptFormModal,
    openAttemptDetail,
  } = useStudentQuizAttempts(studentId, quizId);

  const {
    sortedItems: sortedAttempts,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(attempts, columns);

  const isEmpty = !loading && sortedAttempts.length === 0;

  return (
    <>
      <div className="p-6  min-h-screen">
        <PageHeader
          title="Quản lý bài làm quiz"
          addButtonText="+ Tạo bài làm"
          onAddClick={() => {
            attemptFormModal.open();
          }}
        />

        {/* SEARCH */}
        <div className="flex items-center justify-between mb-4">
          <SearchInput
            placeholder="Tìm kiếm bài làm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th"></th>
                {columns.map((col) => (
                  <TableHeader
                    key={col.path}
                    label={col.header}
                    sortKey={col.path}
                    currentKey={sortKey}
                    order={sortOrder}
                    onClick={() => handleSort(col.path)}
                  />
                ))}

                <th className="table-th">Hành động</th>
              </tr>
            </thead>

            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <DataLoading message="Đang tải bài làm..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <DataError message={error} />
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <DataEmpty message="Không có bài làm nào" />
                  </td>
                </tr>
              ) : (
                sortedAttempts.map((item) => (
                  <DataRow
                    key={item._id}
                    item={item}
                    columns={columns}
                    onViewDetails={() => openAttemptDetail(item)}
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
      </div>

      <AttemptDetailModal />
    </>
  );
};

export default StudentQuizAttemptsPage;
