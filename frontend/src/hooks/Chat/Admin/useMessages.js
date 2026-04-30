import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import {
  openAuditModal,
  closeAuditModal,
} from "../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../features/auditLog/auditLogThunks";

import useModal from "./useModal";
import useDebounce from "./useDebounce";

import {
  removeManyMessages,
  updateMessage,
  reactMessage,
  unreactMessage,
  addReply,
  markViolation,
  fetchAdminMessages,
} from "../features/chat/messagesThunks";

import { selectAdminMessages } from "../features/chat/messagesSlice";
import { exportExcel, exportPDF } from "../components/utils/exportImportUtils";

const useMessages = () => {
  const dispatch = useDispatch();

  /** ================= UI STATE ================= */
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [selected, setSelected] = useState([]);
  const [editMessage, setEditMessage] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [exportType, setExportType] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState([]);

  /** ================= MODALS ================= */
  const messageFormModal = useModal("messageForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const replyModal = useModal("replyModal");
  const exportPreviewModal = useModal("exportPreview");

  const debouncedSearch = useDebounce(search, 500);

  /** ================= REDUX ================= */
  const adminList = useSelector((state) => state.messages.lists.adminMessages);

  const loading = adminList.loading;
  const pagination = adminList.pagination;

  const { totalPages } = pagination;

  const messages = useSelector(selectAdminMessages);

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /** ================= URL PAGINATION ================= */
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  /** ================= FETCH ================= */
  useEffect(() => {
    dispatch(
      fetchAdminMessages({
        page,
        limit,
        search: debouncedSearch,
        type: filterType,
      })
    );
  }, [dispatch, page, limit, debouncedSearch, filterType]);

  /** sync URL */
  useEffect(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);

      if (prev.get("search") !== debouncedSearch) {
        next.set("page", 1);
      }

      next.set("limit", limit);
      next.set("search", debouncedSearch);
      next.set("type", filterType);

      return next;
    });
  }, [debouncedSearch, filterType, limit, setParams]);

  /** ================= PAGINATION ================= */
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
    handlePageChange(page + 1);
  }, [page, totalPages, handlePageChange]);

  const handlePrev = useCallback(() => {
    if (page <= 1) return;
    handlePageChange(page - 1);
  }, [page, handlePageChange]);

  /** ================= COLUMNS ================= */
  const columns = useMemo(
    () => [
      {
        key: "roomId",
        header: "Room ID",
        path: "roomId",
        tooltip: "ID của phòng chat",
      },
      {
        key: "senderName",
        header: "Sender",
        path: "sender.name",
        tooltip: "Tên người gửi",
      },
      {
        key: "content",
        header: "Content",
        path: "content",
        tooltip: "Nội dung tin nhắn",
      },
      {
        key: "messageType",
        header: "Type",
        path: "messageType",
        tooltip: "Loại tin nhắn",
      },
      {
        key: "attachments",
        header: "Attachments",
        path: "attachments",
        tooltip: "Danh sách file đính kèm",
      },
      {
        key: "reactions",
        header: "Reactions",
        path: "reactions",
        tooltip: "Danh sách reaction",
      },
      {
        key: "replyTo",
        header: "Reply To",
        path: "replyTo.content",
        tooltip: "Tin nhắn được reply",
      },
      {
        key: "edited",
        header: "Edited",
        path: "metadata.edited",
        tooltip: "Tin nhắn đã chỉnh sửa",
      },
      {
        key: "deleted",
        header: "Deleted",
        path: "metadata.deleted",
        tooltip: "Tin nhắn đã bị xóa",
      },
      {
        key: "createdAt",
        header: "Created At",
        path: "createdAt",
        tooltip: "Ngày tạo",
      },
    ],
    []
  );

  /** ================= SELECTION ================= */
  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === messages.length ? [] : messages.map((m) => m.id)
    );
  }, [messages]);

  /** ================= DELETE ================= */
  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open({ ids });
    },
    [confirmDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteIds.length) return confirmDeleteModal.close();

    const deleted = messages.filter((m) => pendingDeleteIds.includes(m.id));

    setRecentlyDeleted(deleted);
    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(removeManyMessages(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);
    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, messages, dispatch, undoTimer, confirmDeleteModal]);

  const handleDelete = useCallback(
    (id) => openConfirmDelete([id]),
    [openConfirmDelete]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selected.length) openConfirmDelete(selected);
  }, [selected, openConfirmDelete]);

  const handleUndo = useCallback(() => {
    if (undoTimer) clearTimeout(undoTimer);
    setRecentlyDeleted([]);
  }, [undoTimer]);

  /** ================= UPDATE ================= */
  const handleSubmit = useCallback(
    (form) => {
      if (editMessage) {
        dispatch(updateMessage({ id: editMessage.id, ...form }));
      }
      messageFormModal.close();
    },
    [dispatch, editMessage, messageFormModal]
  );

  const handleInlineUpdate = useCallback(
    (item) => {
      dispatch(updateMessage({ id: item.id, ...item }));

      setRecentlyUpdatedIds((prev) => [
        ...prev.filter((id) => id !== item.id),
        item.id,
      ]);

      setTimeout(() => {
        setRecentlyUpdatedIds((prev) => prev.filter((id) => id !== item.id));
      }, 3000);
    },
    [dispatch]
  );

  /** ================= REACTION / REPLY ================= */
  const handleAddReaction = useCallback(
    (id, emoji) => dispatch(reactMessage({ messageId: id, emoji })),
    [dispatch]
  );

  const handleRemoveReaction = useCallback(
    (id, emoji) => dispatch(unreactMessage({ messageId: id, emoji })),
    [dispatch]
  );

  const handleReply = useCallback(
    (parentId, content) => {
      dispatch(addReply({ parentId, content }));
      replyModal.close();
    },
    [dispatch, replyModal]
  );

  const handleMarkViolation = useCallback(
    (id, reason) => dispatch(markViolation({ messageId: id, reason })),
    [dispatch]
  );

  /** ================= EXPORT ================= */
  const handleExportWithPreview = useCallback(
    (type) => {
      const data =
        selected.length === 0
          ? messages
          : messages.filter((m) => selected.includes(m.id));

      setPreviewData(data);
      setExportType(type);
      exportPreviewModal.open();
    },
    [messages, selected, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (exportType === "pdf") {
      exportPDF(previewData, [], columns, "messages_export.pdf");
    } else {
      exportExcel(previewData, [], "messages_export.xlsx");
    }

    exportPreviewModal.close();
    setExportType(null);
    setPreviewData([]);
  }, [exportType, previewData, columns, exportPreviewModal]);

  /** ================= AUDIT ================= */
  const handleShowMessageHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "messages" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(
    () => dispatch(closeAuditModal()),
    [dispatch]
  );

  /** ================= DERIVED ================= */
  const isEmpty = useMemo(
    () => !adminList.loading && messages.length === 0,
    [adminList.loading, messages.length]
  );

  return {
    messages,
    columns,

    loading,

    isEmpty,

    page,
    totalPages,
    handleNext,
    handlePrev,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    handlePageChange,

    search,
    setSearch,
    filterType,
    setFilterType,

    selected,
    handleSelect,
    handleSelectAll,

    editMessage,
    setEditMessage,
    messageFormModal,

    handleSubmit,
    handleDelete,
    handleDeleteSelected,
    confirmDelete,
    recentlyDeleted,
    handleUndo,

    handleInlineUpdate,
    recentlyUpdatedIds,

    handleAddReaction,
    handleRemoveReaction,
    handleReply,
    replyModal,
    handleMarkViolation,

    handleShowMessageHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    logLoading,

    confirmDeleteModal,
    pendingDeleteIds,

    exportPreviewModal,
    handleExportWithPreview,
    handleConfirmExport,
    previewData,
  };
};

export default useMessages;
