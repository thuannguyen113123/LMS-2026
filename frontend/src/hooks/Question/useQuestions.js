import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  createManyQuestions,
  deleteManyQuestions,
  previewExportQuestions,
  exportQuestions,
} from "../../features/questions/questionsThunks";
import {
  clearRecentlyUpdated,
  selectAdminQuestions,
  selectAdminQuestionsLoading,
  selectQuestionLoading,
  setRecentlyUpdated,
} from "../../features/questions/questionsSlice";
import { handleImportExcel } from "../../components/utils/exportImportUtils";
import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";
import useModal from "../useModal";
import useDebounce from "../useDebounce";
import { normalizeQuestionFromExcel } from "../../utils/normalizeQuestionFromExcel";
import { downloadFile } from "../../helper/downloadFile";

const useQuestions = () => {
  const dispatch = useDispatch();

  /** UI STATE */
  const [selected, setSelected] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [exportType, setExportType] = useState(null);

  /** MODALS */
  const questionFormModal = useModal("questionForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** REDUX STATE */
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.questions
  );
  const adminLoading = useSelector(selectAdminQuestionsLoading);
  const questionLoading = useSelector(selectQuestionLoading);

  const { totalPages } = paginationAdmin;
  const questions = useSelector(selectAdminQuestions);
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  const recentlyUpdatedIds = useSelector(
    (state) => state.questions.recentlyUpdatedIds
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

  /** FILTERS */
  const filters = useMemo(() => {
    return {
      type: params.get("type") || "All",
      difficulty: params.get("difficulty") || "all",
      sort: params.get("sort") || "default",
      quiz: params.get("quiz") || "All",
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
          } else if (value && value !== "all" && value !== "All") {
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

  /** FETCH */
  useEffect(() => {
    dispatch(
      fetchQuestions({
        page,
        limit,
        filters: {
          ...filters,
        },
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, filters, debouncedSearch]);

  /** PAGINATION */
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

  /** TABLE COLUMNS */
  const columns = useMemo(
    () => [
      {
        key: "content",
        header: "Content",
        path: "content",
        tooltip: "Nội dung câu hỏi",
      },
      {
        key: "type",
        header: "Type",
        path: "type",
        tooltip: "Loại câu hỏi",
      },
      {
        key: "correctAnswers",
        header: "Correct Answers",
        path: "correctAnswers",
        tooltip: "Đáp án đúng",
      },
      {
        key: "points",
        header: "Points",
        path: "points",
        tooltip: "Số điểm của câu hỏi",
      },
      {
        key: "quiz",
        header: "Quiz",
        path: "quiz.title",
        tooltip: "Quiz chứa câu hỏi",
      },

      {
        key: "createdAt",
        header: "Created At",
        path: "createdAt",
        tooltip: "Ngày tạo câu hỏi",
      },
    ],
    []
  );

  /** SELECTION */
  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === questions.length ? [] : questions.map((q) => q.id)
    );
  }, [questions]);

  /** DELETE */

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

    const toDelete = questions.filter((q) => pendingDeleteIds.includes(q.id));

    setRecentlyDeleted(toDelete);

    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyQuestions(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, questions, confirmDeleteModal, dispatch, undoTimer]);

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

  /** FORM SUBMIT */
  const handleSubmit = useCallback(
    (form) => {
      if (editQuestion) {
        dispatch(updateQuestion({ id: editQuestion.id, ...form }));
      } else {
        dispatch(createQuestion(form));
      }

      questionFormModal.close();
    },
    [dispatch, editQuestion, questionFormModal]
  );

  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      dispatch(updateQuestion({ id: updatedItem.id, ...updatedItem }));

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

  /** IMPORT */
  const onImportExcel = useCallback(
    (e) => {
      handleImportExcel(e, (rows) => {
        const formatted = rows
          .map((r) => normalizeQuestionFromExcel(r))
          .filter(Boolean);

        if (formatted.length === 0) return;

        dispatch(createManyQuestions(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(
              fetchQuestions({
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

  /** EXPORT */
  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportQuestions({
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
      exportQuestions({
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

  /** AUDIT LOG */
  const handleShowAllQuestionHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "questions" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  /** DERIVED */
  const isEmpty = useMemo(
    () => !adminLoading && questions.length === 0,
    [adminLoading, questions.length]
  );

  const typeOptions = useMemo(
    () => [
      { label: "Tất cả", value: "All" },
      { label: "Multiple Choice", value: "multiple_choice" },
      { label: "True / False", value: "true_false" },
      { label: "Essay", value: "essay" },
    ],
    []
  );

  const columnsConfig = useMemo(
    () => [
      { key: "content", label: "Câu hỏi", editableType: "text" },
      {
        key: "type",
        label: "Loại",
        editableType: "select",
        options: typeOptions,
      },
      { key: "score", label: "Điểm", editableType: "number" },
    ],
    [typeOptions]
  );
  const isSubmitting = editQuestion
    ? questionLoading.update
    : questionLoading.create;

  return {
    questions,
    columns,
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
    editQuestion,
    setEditQuestion,
    questionFormModal,
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
    handleShowAllQuestionHistory,
    handleCloseLogModal,
    columnsConfig,
    recentlyUpdatedIds,
    filters,
    setFilters,
    handlePageChange,
    pendingDeleteIds,
    isSubmitting,
  };
};

export default useQuestions;
