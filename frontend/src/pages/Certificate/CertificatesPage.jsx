import React from "react";

import Pagination from "../../components/Pagintion/Pagination";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import DataRow from "../../components/common/DataRow";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../components/common/DataStates";
import TableHeader from "../../components/common/TableHeader";
import FilterSelect from "../../components/common/FilterSelect";
import useSortableData from "../../hooks/useSortableData";
import useAccessControl from "../../hooks/useAccessControl";
import Can from "../../components/common/can/Can";
import ConfirmModal from "../../components/modal/ConfirmModal";
import UndoSnackbar from "../../components/common/UndoSnackbar";
import useCertificates from "./../../hooks/Certificate/Admin/useCertificates";

const CertificatesPage = () => {
  const {
    certificates,
    columns,

    loading,
    errorCode,
    isEmpty,

    page,
    totalPages,
    hasNext,
    hasPrev,

    handleNext,
    handlePrev,
    handlePageChange,

    search,
    setSearch,

    filters,
    setFilters,
    statusOptions,

    openConfirmRevoke,
    confirmRevoke,
    confirmRevokeModal,
    recentlyRevoked,
    handleUndoRevoke,
    canRevoke,
  } = useCertificates();

  /** ================= SORT ================= */

  const { sortedItems, sortKey, sortOrder, handleSort } = useSortableData(
    certificates,
    columns
  );

  /** ================= ACCESS ================= */

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("certificates.update"),
    canDelete: can("certificates.delete"),
    canPublish: can("certificates.publish"),
  };

  /** ================= RENDER ================= */

  return (
    <>
      <div className="p-6 min-h-screen">
        <PageHeader title="Certificate List" />

        {/* ================= FILTER BAR ================= */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
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

          <SearchInput
            placeholder="Search certificate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <UndoSnackbar
            count={recentlyRevoked.length}
            onUndo={handleUndoRevoke}
          />
        </div>

        {/* ================= TABLE ================= */}
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
                    tooltip={col.tooltip}
                  />
                ))}
                <th className="table-th">Actions</th>
              </tr>
            </thead>

            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td colSpan={columns.length}>
                    <DataLoading message="Loading certificates..." />
                  </td>
                </tr>
              ) : errorCode ? (
                <tr>
                  <td colSpan={columns.length}>
                    <DataError message={errorCode} />
                  </td>
                </tr>
              ) : isEmpty ? (
                <tr>
                  <td colSpan={columns.length}>
                    <DataEmpty message="No certificates found" />
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <DataRow
                    key={item.id || item._id}
                    item={item}
                    columns={columns}
                    permissions={rowPermissions}
                    onDelete={
                      canRevoke(item)
                        ? () => openConfirmRevoke(item.id)
                        : undefined
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="flex justify-center items-center">
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
        <ConfirmModal
          isOpen={confirmRevokeModal.isOpen}
          onClose={confirmRevokeModal.close}
          onConfirm={confirmRevoke}
          message="Bạn có chắc muốn thu hồi chứng chỉ này?"
        />
      </div>
    </>
  );
};

export default CertificatesPage;
