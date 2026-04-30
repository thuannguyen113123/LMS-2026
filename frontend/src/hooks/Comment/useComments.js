import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import useModal from "../useModal";
import useDebounce from "../useDebounce";

import {
  deleteManyComments,
  exportComments,
  fetchComments,
  previewExportComments,
} from "../../features/comment/commentsThunks";

import {
  selectAdminComments,
  selectAdminCommentsLoading,
} from "../../features/comment/commentsSlice";

import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";

import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";

import { downloadFile } from "../../helper/downloadFile";

const useComments = () => {
  const dispatch = useDispatch();

  /** UI STATE **/

  const [selected, setSelected] = useState([]);

  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  const [exportType, setExportType] = useState(null);

  const commentFormModal = useModal("commentForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** REDUX **/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.comments
  );

  const adminLoading = useSelector(selectAdminCommentsLoading);

  const comments = useSelector(selectAdminComments);

  const { totalPages } = paginationAdmin;

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /** URL PARAMS (OFFSET PAGINATION) **/
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const status = params.get("status") || "All";

  const debouncedSearch = useDebounce(search, 500);

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  /** FETCH **/
  useEffect(() => {
    dispatch(
      fetchComments({
        page,
        limit,
        search: debouncedSearch,
        filters: {
          status,
        },
      })
    );
  }, [dispatch, page, limit, debouncedSearch, status]);

  const setSearch = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        next.set("search", value);
        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  const setFilterStatus = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (value === "All") next.delete("status");
        else next.set("status", value);

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  /** PAGINATION **/
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

  /** TABLE COLUMNS **/
  const columns = useMemo(
    () => [
      {
        key: "content",
        header: "Nội dung",
        path: "content",
        tooltip: "Nội dung bình luận",
      },
      {
        key: "targetId",
        header: "Target",
        path: "targetId",
      },
      {
        key: "authorId",
        header: "Tác giả",
        path: "author.fullname",
        tooltip: "ID người viết",
      },
      {
        key: "like_count",
        header: "Thích",
        path: "like_count",
      },
      {
        key: "report_count",
        header: "Báo cáo",
        path: "reportCount",
      },
      {
        key: "createdAt",
        header: "Ngày tạo",
        path: "createdAt",
      },
      {
        key: "updatedAt",
        header: "Ngày cập nhật",
        path: "updatedAt",
      },
    ],
    []
  );

  /** SELECT **/
  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === comments.length ? [] : comments.map((c) => c.id)
    );
  }, [comments]);

  /** DELETE **/
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

    const toDelete = comments.filter((c) => pendingDeleteIds.includes(c.id));

    setRecentlyDeleted(toDelete);

    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyComments(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, comments, confirmDeleteModal, dispatch, undoTimer]);

  const handleDelete = useCallback(
    (id) => openConfirmDelete([id]),
    [openConfirmDelete]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selected.length > 0) openConfirmDelete(selected);
  }, [selected, openConfirmDelete]);

  const handleUndo = useCallback(() => {
    if (undoTimer) clearTimeout(undoTimer);
    setUndoTimer(null);
    setRecentlyDeleted([]);
  }, [undoTimer]);

  /** EXPORT **/
  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportComments({
          scope,
          selectedIds: selected,
          search,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          exportPreviewModal.open();
        }
      });
    },
    [dispatch, selected, search, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportComments({
        scope,
        selectedIds: selected,
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
  }, [dispatch, exportType, selected, search, exportPreviewModal]);

  /** AUDIT **/
  const handleShowAllCommentHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "comments" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  /** EMPTY **/
  const isEmpty = useMemo(
    () => !adminLoading && comments.length === 0,
    [adminLoading, comments.length]
  );

  /** INLINE CONFIG **/
  const columnsConfig = useMemo(
    () => [
      { key: "content", label: "Content", editableType: "text" },
      { key: "like_count", label: "Likes", editableType: "number" },
      { key: "report_count", label: "Reports", editableType: "number" },
    ],
    []
  );

  return {
    comments,

    loading: adminLoading,
    error,
    isEmpty,

    page,
    totalPages,

    handleNext,
    handlePrev,
    handlePageChange,

    hasNext: page < totalPages,
    hasPrev: page > 1,

    search,
    setSearch,

    selected,
    handleSelect,
    handleSelectAll,

    commentFormModal,
    confirmDeleteModal,
    exportPreviewModal,

    handleDelete,
    handleDeleteSelected,
    confirmDelete,

    recentlyDeleted,
    handleUndo,

    handleExportWithPreview,
    handleConfirmExport,

    exportPreview,
    previewLoading,

    logData,
    isLogModalOpen,
    logLoading,
    handleShowAllCommentHistory,
    handleCloseLogModal,

    columns,
    columnsConfig,

    pendingDeleteIds,

    filterStatus: status,
    setFilterStatus,
  };
};

export default useComments;
