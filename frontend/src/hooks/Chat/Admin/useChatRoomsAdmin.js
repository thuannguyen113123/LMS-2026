import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import {
  createChatRoom,
  deleteManyChatRooms,
  banUserFromRoom,
  muteUserInRoom,
  updateRoomSettings,
  setAdminsInRoom,
  addMemberToRoom,
  removeMemberFromRoom,
  fetchRoomMembers,
  fetchAdminChatRooms,
  previewExportChatRooms,
  exportChatRooms,
} from "../../../features/chat/chatRoomsThunks";
import { fetchAuditLogs } from "../../../features/auditLog/auditLogThunks";
import {
  openAuditModal,
  closeAuditModal,
} from "../../../features/auditLog/auditLogSlice";
import {
  clearRecentlyUpdated,
  selectAdminChatRooms,
  selectAdminChatRoomsLoading,
  selectChatRoomsLoading,
  setRecentlyUpdated,
} from "../../../features/chat/chatRoomsSlice";
import { handleImportExcel } from "../../../components/utils/exportImportUtils";
import { downloadFile } from "../../../helper/downloadFile";
import useModal from "../../useModal";
import useDebounce from "../../useDebounce";

const useChatRoomsAdmin = () => {
  const dispatch = useDispatch();

  /*** UI STATE ***/

  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeletedRooms, setRecentlyDeletedRooms] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [editRoom, setEditRoom] = useState(null);

  const [roomIdForMembers, setRoomIdForMembers] = useState(null);

  const [exportType, setExportType] = useState(null);

  /** PAGINATION giống useCourses **/
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const type = params.get("type") || "all";

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  /*** MODALS ***/
  const confirmDeleteModal = useModal("confirmDelete");
  const membersModal = useModal("membersModal");
  const editRoomModal = useModal("editRoomModal");
  const exportPreviewModal = useModal("exportPreview");

  const debouncedSearch = useDebounce(search, 500);

  /*** REDUX STATE ***/
  const { error, paginationAdmin, exportPreview, previewLoading } = useSelector(
    (state) => state.chatRooms
  );
  const adminLoading = useSelector(selectAdminChatRoomsLoading);
  const chatRoomLoading = useSelector(selectChatRoomsLoading);

  const { totalPages } = paginationAdmin;

  const membersByRoom = useSelector((state) => state.chatRooms.membersByRoom);

  const recentlyUpdatedIds = useSelector(
    (state) => state.chatRooms.recentlyUpdatedIds
  );

  const currentRoomMembers = membersByRoom[roomIdForMembers] || [];

  const rooms = useSelector(selectAdminChatRooms);

  const setSearch = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("search", value);
      else next.delete("search");
      next.set("page", 1); // reset page khi filter/search
      return next;
    });
  };

  const setFilterType = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== "all") next.set("type", value);
      else next.delete("type");
      next.set("page", 1);
      return next;
    });
  };

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /*** COLUMNS CONFIG ***/
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Tên phòng",
        path: "name",
        tooltip: "Tên hiển thị của phòng chat",
      },
      {
        key: "type",
        header: "Loại",
        path: "type",
        render: (item) => {
          const map = {
            private: "Private",
            course: "Course",
            class: "Class",
            teacher_student: "Teacher - Student",
            system: "System",
          };
          return map[item.type] || item.type;
        },
      },
      {
        key: "members",
        header: "Thành viên",
        render: (item) => item.user_ids?.length || 0,
      },

      {
        key: "created_at",
        header: "Ngày tạo",
        path: "created_at",
        render: (item) => new Date(item.created_at).toLocaleDateString("vi-VN"),
      },
    ],
    []
  );

  /** FETCH giống courses **/
  useEffect(() => {
    dispatch(
      fetchAdminChatRooms({
        page,
        limit,
        filters: {
          type,
        },
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, type, debouncedSearch]);

  /** PAGE CHANGE **/
  const handlePageChange = useCallback(
    (p) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", p);
        return next;
      });
    },
    [setParams]
  );

  const handleNext = useCallback(() => {
    if (page >= totalPages) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page + 1);
      return next;
    });
  }, [page, totalPages, setParams]);

  const handlePrev = useCallback(() => {
    if (page <= 1) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page - 1);
      return next;
    });
  }, [page, setParams]);

  /*** SELECTION ***/
  const handleSelectRoom = useCallback((id) => {
    setSelectedRoomIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllRooms = useCallback(() => {
    setSelectedRoomIds((prev) =>
      prev.length === rooms.length ? [] : rooms.map((r) => r.id || r._id)
    );
  }, [rooms]);

  /*** DELETE ROOMS ***/
  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open({ ids });
    },
    [confirmDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    if (pendingDeleteIds.length === 0) {
      confirmDeleteModal.close();
      return;
    }

    const toDelete = rooms.filter((room) =>
      pendingDeleteIds.includes(room._id || room.id)
    );

    setRecentlyDeletedRooms(toDelete);
    setSelectedRoomIds([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyChatRooms(pendingDeleteIds));
      setRecentlyDeletedRooms([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, rooms, confirmDeleteModal, dispatch, undoTimer]);

  const handleDeleteRoom = useCallback(
    (id) => openConfirmDelete([id]),
    [openConfirmDelete]
  );

  const onImportExcel = useCallback(
    (e) => {
      handleImportExcel(e, (importedData) => {
        const formatted = importedData.map((row) => ({
          name: row.Name || "",
          type: row.Type || "private",
          membersCount: Number(row.MembersCount || 0),
          createdAt: row.CreatedAt || new Date().toISOString(),
        }));

        formatted.forEach((room) => {
          dispatch(createChatRoom(room));
        });
      });
    },
    [dispatch]
  );

  const handleExportWithPreview = useCallback(
    (exportFormat) => {
      const scope = selectedRoomIds.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(exportFormat);

      dispatch(
        previewExportChatRooms({
          scope,
          selectedIds: selectedRoomIds,
          filters: {
            type, // filter từ URL
          },
          search,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          exportPreviewModal.open();
        }
      });
    },
    [dispatch, selectedRoomIds, type, search, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selectedRoomIds.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportChatRooms({
        scope,
        selectedIds: selectedRoomIds,
        filters: {
          type,
        },
        search,
        format: exportType,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        const { buffer, fileName, contentType } = res.payload;

        downloadFile(buffer, fileName, contentType);
      }
    });

    exportPreviewModal.close();
    setExportType(null);
  }, [dispatch, exportType, selectedRoomIds, type, search, exportPreviewModal]);

  const handleDeleteSelectedRooms = useCallback(() => {
    if (selectedRoomIds.length > 0) openConfirmDelete(selectedRoomIds);
  }, [selectedRoomIds, openConfirmDelete]);

  const handleUndoDelete = useCallback(() => {
    if (undoTimer) clearTimeout(undoTimer);
    setRecentlyDeletedRooms([]);
  }, [undoTimer]);

  /*** ROOM MEMBERS MODAL ***/
  const openMembersModal = useCallback(
    async (roomId) => {
      setRoomIdForMembers(roomId);

      try {
        await dispatch(fetchRoomMembers({ roomId })).unwrap();
        membersModal.open();
      } catch (err) {
        console.error("Fetch members error:", err);
      }
    },
    [dispatch, membersModal]
  );

  /*** BAN USER ***/
  const banUser = useCallback(
    async (roomId, userId) => {
      try {
        await dispatch(banUserFromRoom({ roomId, userId })).unwrap();
      } catch (err) {
        console.error("Ban user error:", err);
      }
    },
    [dispatch]
  );

  /*** MUTE USER ***/
  const muteUser = useCallback(
    async (roomId, userId) => {
      try {
        await dispatch(muteUserInRoom({ roomId, userId })).unwrap();
      } catch (err) {
        console.error("Mute user error:", err);
      }
    },
    [dispatch]
  );

  /*** UPDATE ROOM SETTINGS ***/
  const updateSettings = useCallback(
    async (roomId, settings) => {
      try {
        await dispatch(updateRoomSettings({ roomId, settings })).unwrap();
      } catch (err) {
        console.error("Update room settings error:", err);
      }
    },
    [dispatch]
  );

  const handleInlineUpdate = useCallback(
    async (updatedRoom) => {
      try {
        const id = updatedRoom._id || updatedRoom.id;

        // ✅ chỉ gửi 2 field hợp lệ
        const settings = {
          ...(updatedRoom.name && { name: updatedRoom.name }),
          ...(updatedRoom.type && { type: updatedRoom.type }),
        };

        if (Object.keys(settings).length === 0) return;

        await dispatch(
          updateRoomSettings({
            roomId: id,
            settings,
          })
        ).unwrap();

        dispatch(setRecentlyUpdated(id));
      } catch (err) {
        console.error("Update room settings error:", err);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (!recentlyUpdatedIds.length) return;

    const timers = recentlyUpdatedIds.map((id) =>
      setTimeout(() => {
        dispatch(clearRecentlyUpdated(id));
      }, 3000)
    );

    return () => timers.forEach(clearTimeout);
  }, [recentlyUpdatedIds, dispatch]);

  /*** FILTER TYPE CHANGE ***/
  const handleSetFilterType = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (value && value !== "all") next.set("type", value);
        else next.delete("type");

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  /*** EDIT ROOM MODAL ***/
  const openEditRoomModal = useCallback(
    (room) => {
      setEditRoom(room);
      editRoomModal.open();
    },
    [editRoomModal]
  );

  const closeEditRoomModal = useCallback(() => {
    setEditRoom(null);
    editRoomModal.close();
  }, [editRoomModal]);

  const handleSubmitRoom = useCallback(
    async (form) => {
      try {
        if (editRoom?.id) {
          await dispatch(
            updateRoomSettings({ roomId: editRoom.id, settings: form })
          ).unwrap();
        } else {
          await dispatch(createChatRoom(form)).unwrap();
        }
        closeEditRoomModal();
      } catch (err) {
        console.error("Error submitting room form:", err);
      }
    },
    [dispatch, editRoom, closeEditRoomModal]
  );

  const isEmpty = useMemo(
    () => !adminLoading && rooms.length === 0,
    [adminLoading, rooms.length]
  );

  const typeOptions = useMemo(
    () => [
      { value: "private", label: "Private" },
      { value: "course", label: "Course" },
      { value: "class", label: "Class" },
      { value: "teacher_student", label: "Teacher - Student" },
      { value: "system", label: "System" },
    ],
    []
  );

  const columnsConfig = useMemo(
    () => [
      { key: "name", label: "Tên Phòng", editableType: "text" },
      {
        key: "type",
        label: "Loại",
        editableType: "select",
        options: typeOptions,
      },
      { key: "membersCount", label: "Thành viên", editableType: "number" },
      { key: "createdAt", label: "Ngày tạo", editableType: "date" },
    ],
    [typeOptions]
  );

  const handleSetAdmin = useCallback(
    async (roomId, userId) => {
      try {
        const currentMembers = membersByRoom[roomId] || [];

        const currentAdminIds = currentMembers
          .filter((m) => m.isAdmin)
          .map((m) => m.id);

        const newAdminIds = currentAdminIds.includes(userId)
          ? currentAdminIds.filter((id) => id !== userId)
          : [...currentAdminIds, userId];

        await dispatch(
          setAdminsInRoom({ roomId, adminIds: newAdminIds })
        ).unwrap();

        await dispatch(fetchRoomMembers({ roomId })).unwrap();
      } catch (err) {
        console.error("Set admin error:", err);
        alert("Cấp trưởng nhóm thất bại");
      }
    },
    [dispatch, membersByRoom]
  );

  const handleAddMember = useCallback(
    async (roomId, userId) => {
      try {
        await dispatch(addMemberToRoom({ roomId, userId })).unwrap();
        await dispatch(fetchRoomMembers({ roomId })).unwrap();
      } catch (err) {
        console.error("Add member error:", err);
      }
    },
    [dispatch]
  );

  const handleRemoveMember = useCallback(
    async (roomId, userId) => {
      try {
        await dispatch(removeMemberFromRoom({ roomId, userId })).unwrap();
        await dispatch(fetchRoomMembers({ roomId })).unwrap();
      } catch (err) {
        console.error("Remove member error:", err);
      }
    },
    [dispatch]
  );
  const handleShowAllRoomHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "chatRooms" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  const isSubmitting = editRoom
    ? chatRoomLoading.update
    : chatRoomLoading.create;

  return {
    rooms,
    loading: adminLoading,
    error,
    isEmpty,

    search,
    setSearch,
    setFilterType,
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

    currentRoomMembers,
    membersModal,
    openMembersModal,
    banUser,
    muteUser,

    editRoom,
    openEditRoomModal,
    closeEditRoomModal,
    editRoomModal,
    handleSubmitRoom,

    roomIdForMembers,
    updateSettings,

    columns,
    columnsConfig,
    recentlyUpdatedIds,
    handleInlineUpdate,

    onImportExcel,
    handleExportWithPreview,
    handleConfirmExport,
    exportPreviewModal,

    exportType,
    exportPreview,
    previewLoading,

    handleShowAllRoomHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    logLoading,

    page,
    totalPages,
    handleNext,
    handlePrev,
    handlePageChange,
    hasNext: page < totalPages,
    hasPrev: page > 1,

    handleSetAdmin,
    handleAddMember,
    handleRemoveMember,
    isSubmitting,
  };
};

export default useChatRoomsAdmin;
