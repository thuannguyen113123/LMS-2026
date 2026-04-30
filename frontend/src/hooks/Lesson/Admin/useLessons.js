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
  createLesson,
  createManyLessons,
  deleteManyLessons,
  exportLessons,
  fetchLessons,
  previewExportLessons,
  updateLesson,
} from "../../../features/lessons/lessonsThunks";
import {
  clearRecentlyUpdated,
  selectAdminLessonLoading,
  selectAdminLessons,
  selectLessonLoading,
  setRecentlyUpdated,
} from "../../../features/lessons/lessonsSlice";
import { normalizeLessonFromExcel } from "../../../utils/normalizeLessonFromExcel";
import { downloadFile } from "../../../helper/downloadFile";
import { selectAdminCourses } from "../../../features/courses/coursesSlice";
import { fetchCourses } from "../../../features/courses/coursesThunks";
import useModal from "../../useModal";
import useDebounce from "../../useDebounce";

const useLessons = () => {
  const dispatch = useDispatch();
  const courses = useSelector(selectAdminCourses);

  useEffect(() => {
    if (!courses.length) {
      dispatch(fetchCourses({ page: 1, limit: 100 }));
    }
  }, [courses.length, dispatch]);

  /** UI STATE **/

  const [selected, setSelected] = useState([]);

  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  const [editLesson, setEditLesson] = useState(null);
  const [exportType, setExportType] = useState(null);

  /** MODALS **/
  const lessonFormModal = useModal("lessonForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** REDUX STATE **/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.lessons
  );
  const adminLoading = useSelector(selectAdminLessonLoading);
  const lessonLoading = useSelector(selectLessonLoading);

  const lessons = useSelector(selectAdminLessons);

  const { totalPages } = paginationAdmin || {};

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /** URL PARAMS **/
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  const search = params.get("search") || "";
  const filters = useMemo(() => {
    return {
      course: params.get("course") || "all",
      type: params.get("type") ? params.get("type").split(",") : [],
      status: params.get("status") ? params.get("status").split(",") : [],
      sort: params.get("sort") || "default",
    };
  }, [params]);
  const setSearch = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (value) next.set("search", value);
        else next.delete("search");

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );
  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            if (value.length) next.set(key, value.join(","));
            else next.delete(key);
          } else if (!value || value === "all") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  const debouncedSearch = useDebounce(search, 500);

  /** UPDATED ROW **/
  const recentlyUpdatedIds = useSelector(
    (state) => state.lessons.recentlyUpdatedIds
  );

  /** FETCH **/
  useEffect(() => {
    dispatch(
      fetchLessons({
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

  /** TABLE COLUMNS **/
  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Lesson",
        path: "title",
      },

      {
        key: "course",
        header: "Course",
        path: "course.title",
      },

      {
        key: "order",
        header: "Order",
        path: "order",
        type: "number",
      },

      {
        key: "duration",
        header: "Duration",
        path: "duration",
        render: (item) => `${item.duration} min`,
      },

      {
        key: "isPublished",
        header: "Published",
        path: "isPublished",
        type: "boolean",
      },

      {
        key: "createdAt",
        header: "Created",
        path: "createdAt",
        render: (item) => new Date(item.createdAt).toLocaleDateString(),
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
      prev.length === lessons.length ? [] : lessons.map((l) => l.id)
    );
  }, [lessons]);

  /** DELETE **/
  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open({ ids });
    },
    [confirmDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteIds.length) return;

    const toDelete = lessons.filter((l) => pendingDeleteIds.includes(l.id));
    setRecentlyDeleted(toDelete);
    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyLessons(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, lessons, dispatch, undoTimer, confirmDeleteModal]);

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

  /** FORM SUBMIT **/
  const handleSubmit = useCallback(
    (form) => {
      if (editLesson) {
        dispatch(updateLesson({ id: editLesson.id, ...form }));
      } else {
        dispatch(createLesson(form));
      }
      lessonFormModal.close();
    },
    [dispatch, editLesson, lessonFormModal]
  );

  /** INLINE UPDATE **/
  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      const {
        slug: _slug,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        createdBy: _createdBy,
        updatedBy: _updatedBy,
        _id: __id,
        __v: ___v,
        course,
        id,
        ...rest
      } = updatedItem;

      const payload = {
        ...rest,

        course: typeof course === "object" ? course?.id || course?._id : course,

        order: rest.order ? Number(rest.order) : undefined,
        duration: rest.duration ? Number(rest.duration) : undefined,
      };

      dispatch(updateLesson({ id, ...payload }));

      dispatch(setRecentlyUpdated(id));
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
        const formatted = rows
          .map((r) => normalizeLessonFromExcel(r))
          .filter(Boolean);

        if (!formatted.length) return;

        dispatch(createManyLessons(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(
              fetchLessons({
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
        previewExportLessons({
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
      exportLessons({
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

  /** AUDIT LOG **/
  const handleShowAllLessonHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "lessons" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  const isEmpty = useMemo(
    () => !adminLoading && lessons.length === 0,
    [adminLoading, lessons.length]
  );

  const columnsConfig = useMemo(
    () => [
      {
        key: "title",
        label: "Lesson Title",
        editableType: "text",
      },

      {
        key: "order",
        label: "Order",
        editableType: "number",
      },

      {
        key: "duration",
        label: "Duration",
        editableType: "number",
      },

      {
        key: "isPublished",
        label: "Published",
        editableType: "select",
        options: [
          { label: "Published", value: true },
          { label: "Draft", value: false },
        ],
      },
    ],
    []
  );
  const isSubmitting = editLesson ? lessonLoading.update : lessonLoading.create;

  return {
    lessons,
    courses,

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

    editLesson,
    setEditLesson,

    lessonFormModal,
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
    handleShowAllLessonHistory,
    handleCloseLogModal,

    columns,
    columnsConfig,
    recentlyUpdatedIds,

    filters,
    setFilters,
    isSubmitting,
  };
};

export default useLessons;
