import React from "react";
import { FaHistory } from "react-icons/fa";

import Pagination from "../../../components/Pagintion/Pagination";
import CommonModal from "../../../components/modal/CommonModal";
import RoomForm from "../../../components/form/RoomForm";
import PageHeader from "../../../components/common/PageHeader";
import FilterSelect from "../../../components/common/FilterSelect";
import SearchInput from "../../../components/common/SearchInput";
import UndoSnackbar from "../../../components/common/UndoSnackbar";
import ConfirmModal from "../../../components/modal/ConfirmModal";
import DataRow from "../../../components/common/DataRow";

import useSortableData from "../../../hooks/useSortableData";
import TableHeader from "../../../components/common/TableHeader";
import {
  DataEmpty,
  DataError,
  DataLoading,
} from "../../../components/common/DataStates";
import ImportExportButtons from "../../../components/common/ImportExportButtons";
import ExportPreviewModal from "../../../components/modal/ExportPreviewModal";
import AuditLogModal from "../../../components/modal/AuditLogModal";
import RoomMembersModal from "../../../components/modal/RoomMembersModal";
import useAccessControl from "../../../hooks/useAccessControl";
import Can from "../../../components/common/can/Can";
import useChatRoomsAdmin from "./../../../hooks/Chat/Admin/useChatRoomsAdmin";

const ChatRoomsAdminPage = () => {
  const {
    rooms,
    totalPages,
    handlePageChange,
    loading,
    error,
    isEmpty,

    search,
    setSearch,

    type,
    handleSetFilterType,

    selectedRoomIds,
    handleSelectRoom,
    handleSelectAllRooms,

    handleDeleteRoom,
    handleDeleteSelectedRooms,
    handleUndoDelete,
    confirmDeleteModal,
    confirmDelete,
    pendingDeleteIds,
    recentlyDeletedRooms,

    editRoom,
    openEditRoomModal,
    closeEditRoomModal,
    editRoomModal,
    handleSubmitRoom,

    membersModal,
    openMembersModal,
    banUser,
    muteUser,

    columns,
    columnsConfig,
    handleInlineUpdate,
    recentlyUpdatedIds,

    onImportExcel,

    handleExportWithPreview,
    handleConfirmExport,
    exportPreview,
    previewLoading,
    exportPreviewModal,
    handleShowAllRoomHistory,
    isLogModalOpen,
    handleCloseLogModal,
    logData,

    handleNext,
    handlePrev,
    page,
    hasNext,
    hasPrev,
    handleSetAdmin,
    handleAddMember,
    handleRemoveMember,
    roomIdForMembers,
    currentRoomMembers,
    isSubmitting,
  } = useChatRoomsAdmin();

  const {
    sortedItems: sortedRooms,
    sortKey,
    sortOrder,
    handleSort,
  } = useSortableData(rooms, columns);

  const { can } = useAccessControl();

  const rowPermissions = {
    canEdit: can("chatrooms.update"),
    canDelete: can("chatrooms.delete"),
    canPublish: can("chatrooms.publish"),
  };
  return (
    <>
      <div className="p-6 min-h-screen">
        <PageHeader
          title="Quản lý phòng chat"
          addButtonText="+ Thêm phòng"
          onAddClick={() => openEditRoomModal(null)}
        />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <FilterSelect
              options={[
                { label: "-- Tất cả loại --", value: "all" },
                { label: "Private", value: "private" },
                { label: "Course", value: "course" },
                { label: "Class", value: "class" },
                { label: "Teacher - Student", value: "teacher_student" },
                { label: "System", value: "system" },
              ]}
              value={type}
              onChange={handleSetFilterType}
            />
          </div>

          <SearchInput
            placeholder="Tìm kiếm phòng chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Can permission="chatrooms.export">
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
                onClick={handleShowAllRoomHistory}
              >
                <FaHistory size={18} />
                Lịch sử
              </button>
            </Can>
          </div>
          <UndoSnackbar
            count={recentlyDeletedRooms.length}
            onUndo={handleUndoDelete}
          />
        </div>

        <div className="overflow-x-auto bg-card rounded-lg shadow">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-th">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả phòng"
                    checked={
                      selectedRoomIds.length > 0 &&
                      selectedRoomIds.length === rooms.length
                    }
                    onChange={handleSelectAllRooms}
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
                    <DataLoading message="Đang tải phòng chat..." />
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
                    <DataEmpty message="Không có phòng chat nào" />
                  </td>
                </tr>
              ) : (
                sortedRooms.map((room) => (
                  <DataRow
                    key={room.id}
                    item={room}
                    isSelected={selectedRoomIds.includes(room.id)}
                    onSelect={handleSelectRoom}
                    onInlineUpdate={handleInlineUpdate}
                    onEdit={() => openEditRoomModal(room)}
                    onDelete={() => handleDeleteRoom(room.id)}
                    onViewDetails={() => openMembersModal(room.id || room._id)}
                    columns={columns}
                    columnsConfig={columnsConfig}
                    highlightRow={recentlyUpdatedIds?.includes(
                      room.id || room._id
                    )}
                    permissions={rowPermissions}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination nếu có */}
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
        <Can permission="chatrooms.delete">
          {selectedRoomIds.length > 0 && (
            <div className="mt-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteSelectedRooms}
                aria-label={`Xóa ${selectedRoomIds.length} phòng đã chọn`}
              >
                Xóa {selectedRoomIds.length} phòng đã chọn
              </button>
            </div>
          )}
        </Can>
      </div>

      {/* Modal thêm/sửa phòng */}
      <CommonModal
        isOpen={editRoomModal.isOpen}
        onClose={closeEditRoomModal}
        title={editRoom ? "Sửa phòng chat" : "Thêm phòng chat"}
      >
        <RoomForm
          initialData={editRoom}
          onSubmit={handleSubmitRoom}
          isLoading={isSubmitting}
        />
      </CommonModal>

      {/* Modal xác nhận xóa */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={confirmDeleteModal.close}
        onConfirm={confirmDelete}
        message={
          pendingDeleteIds?.length === 1
            ? "Bạn có chắc chắn muốn xóa phòng chat này?"
            : `Bạn có chắc chắn muốn xóa ${pendingDeleteIds?.length} phòng đã chọn không?`
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

      {/* Modal thành viên phòng */}
      <RoomMembersModal
        isOpen={membersModal.isOpen}
        onClose={membersModal.close}
        roomId={roomIdForMembers}
        onBan={banUser}
        onMute={muteUser}
        onSetAdmin={handleSetAdmin}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        members={currentRoomMembers}
      />

      <AuditLogModal
        isOpen={isLogModalOpen}
        onClose={handleCloseLogModal}
        logs={logData}
      />
    </>
  );
};

export default ChatRoomsAdminPage;
