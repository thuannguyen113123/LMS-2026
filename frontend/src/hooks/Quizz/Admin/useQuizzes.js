import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { handleImportExcel } from "../../../components/utils/exportImportUtils";
import {
  openAuditModal,
  closeAuditModal,
} from "../../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../../features/auditLog/auditLogThunks";

import {
  createQuiz,
  createManyQuizzes,
  deleteManyQuizzes,
  fetchQuizzes,
  updateQuiz,
  previewExportQuizzes,
  exportQuizzes,
} from "../../../features/quizzes/quizzesThunks";
import {
  clearRecentlyUpdated,
  selectAdminQuizzes,
  selectAdminQuizzesLoading,
  selectQuizLoading,
  setRecentlyUpdated,
} from "../../../features/quizzes/quizzesSlice";
import { normalizeQuizFromExcel } from "../../../utils/normalizeQuizFromExcel";
import { downloadFile } from "../../../helper/downloadFile";
import useModal from "../../useModal";
import useDebounce from "../../useDebounce";

const statusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Published", value: "Published" },
  { label: "Archived", value: "Archived" },
];

const useQuizzes = () => {
  const dispatch = useDispatch();

  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [editQuiz, setEditQuiz] = useState(null);
  const [exportType, setExportType] = useState(null);

  /** MODALS **/
  const quizFormModal = useModal("quizForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** REDUX **/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.quizzes
  );
  const adminLoading = useSelector(selectAdminQuizzesLoading);
  const quizLoading = useSelector(selectQuizLoading);
  const quizzes = useSelector(selectAdminQuizzes);
  const { totalPages } = paginationAdmin;

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  const recentlyUpdatedIds = useSelector(
    (state) => state.quizzes.recentlyUpdatedIds
  );
  const search = params.get("search") || "";
  const setSearch = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (!value) next.delete("search");
        else next.set("search", value);

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  const debouncedSearch = useDebounce(search, 500);
  /** Filters **/
  const filters = useMemo(() => {
    return {
      status: params.get("status")?.split(",") || [],
      difficulty: params.get("difficulty") || "all",
      sort: params.get("sort") || "default",
      courseId: params.get("courseId") || "all",
    };
  }, [params]);
  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            if (value.length) next.set(key, value.join(","));
            else next.delete(key);
          } else if (value && value !== "all") {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        });

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  /** FETCH **/
  useEffect(() => {
    dispatch(
      fetchQuizzes({
        page,
        limit,
        filters,
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, filters, debouncedSearch]);

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

  /** SELECT **/
  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === quizzes.length ? [] : quizzes.map((q) => q.id)
    );
  }, [quizzes]);

  /** DELETE **/
  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open({ ids });
    },
    [confirmDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    if (pendingDeleteIds.length === 0) return;

    const toDelete = quizzes.filter((q) => pendingDeleteIds.includes(q.id));

    setRecentlyDeleted(toDelete);

    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyQuizzes(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);

    confirmDeleteModal.close();
  }, [pendingDeleteIds, quizzes, dispatch, undoTimer, confirmDeleteModal]);

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

  /** FORM **/
  const handleSubmit = useCallback(
    (form) => {
      if (editQuiz) {
        dispatch(updateQuiz({ id: editQuiz.id, ...form }));
      } else {
        dispatch(createQuiz(form));
      }

      quizFormModal.close();
    },
    [dispatch, editQuiz, quizFormModal]
  );

  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      dispatch(updateQuiz({ id: updatedItem.id, ...updatedItem }));

      dispatch(setRecentlyUpdated(updatedItem.id));
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

  /** IMPORT **/
  const onImportExcel = useCallback(
    (e) => {
      handleImportExcel(e, (rows) => {
        const formatted = rows.map(normalizeQuizFromExcel).filter(Boolean);

        if (!formatted.length) return;

        dispatch(createManyQuizzes(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(
              fetchQuizzes({
                page: 1,
                limit,
                filters,
                search: debouncedSearch,
              })
            );
          }
        });
      });
    },
    [dispatch, filters, debouncedSearch, limit]
  );

  /** EXPORT **/
  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportQuizzes({
          scope,
          selectedIds: selected,
          filters,
          search,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          exportPreviewModal.open();
        }
      });
    },
    [dispatch, selected, filters, search, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportQuizzes({
        scope,
        selectedIds: selected,
        filters,
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
  }, [dispatch, exportType, selected, filters, search, exportPreviewModal]);

  /** AUDIT **/
  const handleShowAllQuizHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "quizzes" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  const isEmpty = useMemo(
    () => !adminLoading && quizzes.length === 0,
    [adminLoading, quizzes.length]
  );

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Quiz Title",
        path: "title",
        tooltip: "Tên bài quiz hoặc bài thi.",
      },
      {
        key: "course",
        header: "Course",
        path: "course.title",
        tooltip: "Khóa học mà quiz thuộc về.",
      },
      {
        key: "type",
        header: "Type",
        path: "type",
        tooltip: "Loại quiz (exam / quiz).",
      },

      {
        key: "timeLimit",
        header: "Time Limit",
        path: "timeLimit",
        tooltip: "Thời gian làm bài (phút).",
      },
      {
        key: "isPublished",
        header: "Status",
        path: "isPublished",
        type: "boolean",
        tooltip: "Trạng thái xuất bản.",
      },
      {
        key: "updatedAt",
        header: "Updated",
        path: "updatedAt",
        tooltip: "Ngày cập nhật gần nhất.",
      },
    ],
    []
  );

  const columnConfigs = {
    title: {
      type: "text",
      editableType: "text",
      className: "font-medium",
    },

    course: {
      type: "text",
      path: "course.title",
      fallback: "—",
    },

    type: {
      type: "badge",
      colorMap: {
        exam: "red",
        quiz: "blue",
      },
    },

    timeLimit: {
      type: "text",
      editableType: "number",
      render: (value) => `${value} min`,
    },

    passingScore: {
      type: "number",
      editableType: "number",
    },

    maxAttempts: {
      type: "number",
      editableType: "number",
    },

    isPublished: {
      type: "badge",
      editableType: "select",
      render: (value) => (value ? "Published" : "Draft"),
      options: [
        { label: "Draft", value: false },
        { label: "Published", value: true },
      ],
      colorMap: {
        Published: "green",
        Draft: "gray",
      },
    },

    updatedAt: {
      type: "date",
    },
  };
  const isSubmitting = editQuiz ? quizLoading.update : quizLoading.create;

  return {
    quizzes,
    loading: adminLoading,
    error,
    isEmpty,
    page,
    totalPages,
    handleNext,
    handlePrev,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    search,
    setSearch,
    selected,
    handleSelect,
    handleSelectAll,
    editQuiz,
    setEditQuiz,
    quizFormModal,
    confirmDeleteModal,
    exportPreviewModal,
    handleSubmit,
    handleDelete,
    handleDeleteSelected,
    confirmDelete,
    recentlyDeleted,
    handleUndo,
    handleInlineUpdate,
    onImportExcel,
    handleExportWithPreview,
    handleConfirmExport,
    exportPreview,
    previewLoading,
    logData,
    isLogModalOpen,
    logLoading,
    handleShowAllQuizHistory,
    handleCloseLogModal,
    recentlyUpdatedIds,
    filters,
    setFilters,
    handlePageChange,
    pendingDeleteIds,
    statusOptions,
    columns,
    columnConfigs,
    isSubmitting,
  };
};

export default useQuizzes;
