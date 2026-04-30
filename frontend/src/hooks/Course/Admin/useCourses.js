import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";

import { handleImportExcel } from "../../../components/utils/exportImportUtils";
import {
  openAuditModal,
  closeAuditModal,
} from "../../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../../features/auditLog/auditLogThunks";
import {
  createCourse,
  createManyCourses,
  deleteManyCourses,
  exportCourses,
  fetchCourses,
  previewExportCourses,
  updateCourse,
} from "../../../features/courses/coursesThunks";
import {
  clearRecentlyUpdated,
  selectAdminCourses,
  selectAdminLoading,
  selectCourseLoading,
  setRecentlyUpdated,
} from "../../../features/courses/coursesSlice";
import { normalizeCourseFromExcel } from "../../../utils/normalizeCourseFromExcel";
import { downloadFile } from "../../../helper/downloadFile";
import { useSearchParams } from "react-router-dom";
import useModal from "../../useModal";
import useDebounce from "../../useDebounce";

const statusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Published", value: "Published" },
  { label: "Archived", value: "Archived" },
];

const useCourses = (slug = null) => {
  const dispatch = useDispatch();

  /*** UI STATE ***/

  const [selected, setSelected] = useState([]);

  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [exportType, setExportType] = useState(null);

  /*** MODALS ***/
  const courseFormModal = useModal("courseForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /*** REDUX STATE ***/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.courses
  );
  const adminLoading = useSelector(selectAdminLoading);
  const courseLoading = useSelector(selectCourseLoading);

  const { totalPages } = paginationAdmin;

  const courses = useSelector(selectAdminCourses);

  const recentlyUpdatedIds = useSelector(
    (state) => state.courses.recentlyUpdatedIds
  );

  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const debouncedSearch = useDebounce(search, 500);

  const setSearch = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (value) next.set("search", value);
        else next.delete("search");

        next.set("page", 1); // reset pagination khi search

        return next;
      });
    },
    [setParams]
  );

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /*** LOCAL PAGINATION STATE ***/

  // 🧩 Filter state (UI → API)
  const filters = useMemo(() => {
    return {
      category: params.get("category") || "all",
      status: params.get("status")?.split(",") || [],
      price: params.get("price") || "all",
      rating: params.get("rating") || null,
      sort: params.get("sort") || "default",
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

  /*** FETCH khi search/filter/slug thay đổi ***/
  useEffect(() => {
    dispatch(
      fetchCourses({
        page,
        limit,
        filters,
        search: debouncedSearch,
        slug,
      })
    );
  }, [dispatch, page, limit, filters, debouncedSearch, slug]);

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

  /** NEXT PAGE **/
  const handleNext = useCallback(() => {
    if (page >= totalPages) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page + 1);
      return next;
    });
  }, [page, totalPages, setParams]);
  /** PREV PAGE **/
  const handlePrev = useCallback(() => {
    if (page <= 1) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page - 1);
      return next;
    });
  }, [page, setParams]);

  const columns = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        path: "title",
      },
      {
        key: "category",
        header: "Category",
        path: "category",
        render: (item) => item.category?.name || "",
      },
      {
        key: "rating",
        header: "Rating",
        path: "rating",
      },
      {
        key: "duration",
        header: "Duration",
        path: "duration",
      },
      {
        key: "price",
        header: "Price",
        path: "price",
      },
      {
        key: "discountPrice",
        header: "Discount Price",
        path: "discountPrice",
      },
      {
        key: "status",
        header: "Status",
        path: "status",
        type: "boolean",
        render: (item) => item.status?.toLowerCase(),
      },
      {
        key: "createdAt",
        header: "Created At",
        path: "createdAt",
        render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN"),
      },
    ],
    []
  );

  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);
  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === courses.length ? [] : courses.map((c) => c.id)
    );
  }, [courses]);

  /*** DELETE ***/
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

    const toDelete = courses.filter((course) =>
      pendingDeleteIds.includes(course.id)
    );

    setRecentlyDeleted(toDelete);

    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyCourses(pendingDeleteIds)); // gọi thunk xóa nhiều
      setRecentlyDeleted([]);
    }, 5000);
    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, courses, confirmDeleteModal, dispatch, undoTimer]);

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

  /*** FORM SUBMIT ***/
  const handleSubmit = useCallback(
    (form) => {
      if (editCourse) {
        dispatch(updateCourse({ id: editCourse.id, ...form }));
      } else {
        dispatch(createCourse(form));
      }
      courseFormModal.close();
    },
    [dispatch, editCourse, courseFormModal]
  );

  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      const {
        slug: _,
        createdAt: __,
        updatedAt: ___,
        _id,
        __v,
        id,
        category,
        instructor,
        ...rest
      } = updatedItem;

      const payload = {
        ...rest,

        category:
          typeof category === "object"
            ? category?.id || category?._id
            : category,

        instructor:
          typeof instructor === "object"
            ? instructor?.id || instructor?._id
            : instructor,

        duration: rest.duration ? Number(rest.duration) : undefined,
        rating: rest.rating ? Number(rest.rating) : undefined,
        price: rest.price ? Number(rest.price) : undefined,
        discountPrice: rest.discountPrice
          ? Number(rest.discountPrice)
          : undefined,
      };

      dispatch(updateCourse({ id, ...payload }));
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

  /*** EXPORT / IMPORT ***/
  const onImportExcel = useCallback(
    (e) => {
      console.log("🔥 IMPORT CLICKED");
      console.log("📂 FILE:", e.target.files?.[0]);

      handleImportExcel(e, (rows) => {
        console.log("📊 RAW ROWS:", rows);

        const formatted = rows
          .map((r, i) => {
            const f = normalizeCourseFromExcel(r);
            console.log(`🧩 ROW ${i}:`, f);
            return f;
          })
          .filter(Boolean);

        console.log("✅ FORMATTED:", formatted);

        if (formatted.length === 0) {
          console.warn("❌ No valid rows after normalize");
          return;
        }

        dispatch(createManyCourses(formatted)).then((res) => {
          console.log("🚀 DISPATCH RESULT:", res);

          if (res.meta.requestStatus === "fulfilled") {
            console.log("✅ IMPORT SUCCESS — refetch");

            dispatch(
              fetchCourses({
                page: 1,
                limit,
                filters,
                search: debouncedSearch,
                slug,
              })
            );
          } else {
            console.error("❌ IMPORT FAILED:", res);
          }
        });
      });
    },
    [dispatch, slug, filters, debouncedSearch, limit]
  );

  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportCourses({
          scope,
          selectedIds: selected,
          filters,
          search,
          slug,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          exportPreviewModal.open();
        }
      });
    },
    [dispatch, selected, filters, search, slug, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportCourses({
        scope,
        selectedIds: selected,
        filters,
        search,
        slug,
        format: exportType, // pdf | excel
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        const { buffer, fileName, contentType } = res.payload;
        downloadFile(buffer, fileName, contentType);
      }
    });

    exportPreviewModal.close();
    setExportType(null);
  }, [
    dispatch,
    exportType,
    selected,
    filters,
    search,
    slug,
    exportPreviewModal,
  ]);

  /*** AUDIT LOG ***/
  const handleShowAllCourseHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "courses" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  const isEmpty = useMemo(
    () => !adminLoading && courses.length === 0,
    [adminLoading, courses.length]
  );

  const columnsConfig = useMemo(
    () => [
      {
        key: "title",
        label: "Title",
        editableType: "text",
      },
      {
        key: "rating",
        label: "Rating",
        editableType: "text",
      },
      {
        key: "duration",
        label: "Duration",
        editableType: "text",
      },
      {
        key: "price",
        label: "Price",
        editableType: "text",
      },
      {
        key: "discountPrice",
        label: "Discount Price",
        editableType: "text",
      },
      {
        key: "status",
        label: "Status",
        editableType: "select",
        options: statusOptions,
      },
    ],
    []
  );
  const isSubmitting = editCourse ? courseLoading.update : courseLoading.create;
  return {
    courses,

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

    editCourse,
    isSubmitting,
    setEditCourse,

    courseFormModal,
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
    handleShowAllCourseHistory,
    handleCloseLogModal,

    columns,
    columnsConfig,
    recentlyUpdatedIds,

    filters,
    setFilters,
    handlePageChange,
    pendingDeleteIds,
  };
};

export default useCourses;
