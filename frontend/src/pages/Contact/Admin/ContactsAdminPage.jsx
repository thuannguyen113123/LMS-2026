import React from "react";

import PageHeader from "../../../components/common/PageHeader";
import SearchInput from "../../../components/common/SearchInput";
import Pagination from "../../../components/Pagintion/Pagination";
import ConfirmModal from "../../../components/modal/ConfirmModal";
import UndoSnackbar from "../../../components/common/UndoSnackbar";
import DataRow from "../../../components/common/DataRow";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../../components/common/DataStates";
import TableHeader from "../../../components/common/TableHeader";
import useContactsAdmin from "../../../hooks/Contact/useContactsAdmin";
import useSortableData from "../../../hooks/useSortableData";
import useAccessControl from "../../../hooks/useAccessControl";
import FilterSelect from "../../../components/common/FilterSelect";

const ContactsAdminPage = () => {
  const {
    contacts,
    columns,
    loading,
    errorCode,
    isEmpty,
    selected,
    handleSelect,
    handleSelectAll,
    confirmDeleteModal,
    openConfirmDelete,
    confirmDelete,
    pendingDeleteIds,
    recentlyDeleted,
    handleUndo,
    page,
    totalPages,
    handlePageChange,
    search,
    setSearch,
    handleInlineUpdate,
    columnsConfig,

    filters,
    setFilters,
    statusOptions,
  } = useContactsAdmin();

  const {
    sortedItems: sortedContacts,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(contacts, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("contacts.update"),
    canDelete: can("contacts.delete"),
  };

  return (
    <div className="p-6 min-h-screen">
      <PageHeader title="Contacts" />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <SearchInput
          placeholder="Search contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterSelect
          label="Loại liên hệ"
          value={filters.status}
          options={statusOptions}
          onChange={(value) => setFilters({ status: value })}
        />
        <UndoSnackbar count={recentlyDeleted.length} onUndo={handleUndo} />
      </div>

      <div className="overflow-x-auto bg-card rounded-lg shadow">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th className="table-th">
                <input
                  type="checkbox"
                  aria-label="Select all contacts"
                  checked={
                    selected.length > 0 && selected.length === contacts.length
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
                />
              ))}

              <th className="table-th">Actions</th>
            </tr>
          </thead>

          <tbody className="table-body">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2}>
                  <DataLoading message="Loading contacts..." />
                </td>
              </tr>
            ) : errorCode ? (
              <tr>
                <td colSpan={columns.length + 2}>
                  <DataError message="Failed to load contacts" />
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length + 2}>
                  <DataEmpty message="No contacts found" />
                </td>
              </tr>
            ) : (
              sortedContacts.map((contact) => (
                <DataRow
                  key={contact.id}
                  item={contact}
                  isSelected={selected.includes(contact.id)}
                  onSelect={handleSelect}
                  onDelete={() => openConfirmDelete([contact.id])}
                  columns={columns}
                  permissions={rowPermissions}
                  columnsConfig={columnsConfig}
                  onInlineUpdate={handleInlineUpdate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {selected.length > 0 && rowPermissions.canDelete && (
        <div className="mt-2 flex justify-end">
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => openConfirmDelete(selected)}
            aria-label={`Delete ${selected.length} selected contacts`}
          >
            Delete {selected.length} selected
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds.length === 1
            ? "Are you sure you want to delete this contact?"
            : `Are you sure you want to delete ${pendingDeleteIds.length} selected contacts?`
        }
      />
    </div>
  );
};

export default ContactsAdminPage;
