import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { handleImportExcel } from "../../components/utils/exportImportUtils";
import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";

import useModal from "../useModal";
import useDebounce from "../useDebounce";
import {
  createStudent,
  createManyStudents,
  deleteManyStudents,
  fetchStudents,
  updateStudent,
  previewExportStudents,
  exportStudents,
} from "../../features/student/studentsThunks";
import {
  clearRecentlyUpdated,
  selectAdminStudents,
  selectAdminStudentsLoading,
  selectStudentLoading,
  setRecentlyUpdated,
} from "../../features/student/studentsSlice";
import { normalizeStudentFromExcel } from "../../utils/normalizeStudentFromExcel";
import { downloadFile } from "../../helper/downloadFile";
import useUsers from "./../User/useUser";

export const preferenceOptions = [
  { label: "Dark Mode On", value: "true", key: "darkMode" },
  { label: "Dark Mode Off", value: "false", key: "darkMode" },

  { label: "Notifications On", value: "true", key: "notifications" },
  { label: "Notifications Off", value: "false", key: "notifications" },

  { label: "Language Vietnamese", value: "vi", key: "language" },
  { label: "Language English", value: "en", key: "language" },
];

// helper đọc nested value
const getValueByPath = (obj, path) => {
  if (!obj || !path) return "";
  return path.split(".").reduce((acc, key) => acc && acc[key], obj) ?? "";
};

const useStudents = () => {
  const dispatch = useDispatch();

  /** UI STATE **/
  const [selected, setSelected] = useState([]);

  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  const [editStudent, setEditStudent] = useState(null);
  const [exportType, setExportType] = useState(null);

  const recentlyUpdatedIds = useSelector(
    (state) => state.courses.recentlyUpdatedIds
  );

  /** MODALS **/
  const studentFormModal = useModal("studentForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** REDUX **/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.students
  );
  const adminLoading = useSelector(selectAdminStudentsLoading);
  const studentLoading = useSelector(selectStudentLoading);
  const students = useSelector(selectAdminStudents);

  const { totalPages } = paginationAdmin;

  const { users } = useUsers();

  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

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

  /** AUDIT LOG **/
  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /** FILTERS **/
  const filters = useMemo(() => {
    return {
      language: params.get("language") || "all",
      darkMode: params.get("darkMode") || "all",
      notifications: params.get("notifications") || "all",
      sort: params.get("sort") || "latest",
    };
  }, [params]);

  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (value && value !== "all") {
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
      fetchStudents({
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
        key: "fullname",
        header: "Full Name",
        path: "user.fullname",
        tooltip: "Họ và tên của học viên.",
      },
      {
        key: "email",
        header: "Email",
        path: "user.email",
        tooltip: "Địa chỉ email của học viên.",
      },
      {
        key: "phone",
        header: "Phone",
        path: "user.phone",
        tooltip: "Số điện thoại liên hệ.",
      },
      {
        key: "slug",
        header: "Slug",
        path: "slug",
        tooltip: "Slug định danh của học viên.",
      },
      {
        key: "enrolledCourses",
        header: "Enrolled Courses",
        path: "enrolledCourses.length",
        tooltip: "Số khóa học mà học viên đã đăng ký.",
      },
      {
        key: "createdAt",
        header: "Enrollment Date",
        path: "createdAt",
        tooltip: "Ngày học viên được tạo trong hệ thống.",
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
      prev.length === students.length ? [] : students.map((s) => s.id)
    );
  }, [students]);

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

    const toDelete = students.filter((s) => pendingDeleteIds.includes(s.id));

    setRecentlyDeleted(toDelete);

    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyStudents(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, students, confirmDeleteModal, dispatch, undoTimer]);

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

  /** FORM SUBMIT **/
  const handleSubmit = useCallback(
    (form) => {
      if (editStudent) {
        dispatch(updateStudent({ id: editStudent.id, ...form }));
      } else {
        dispatch(createStudent(form));
      }

      studentFormModal.close();
    },
    [dispatch, editStudent, studentFormModal]
  );

  /** INLINE UPDATE **/
  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      dispatch(updateStudent({ id: updatedItem.id, ...updatedItem }));
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

  /** IMPORT EXCEL **/
  const onImportExcel = useCallback(
    (e) => {
      handleImportExcel(e, (rows) => {
        const formatted = rows
          .map((r) => normalizeStudentFromExcel(r))
          .filter(Boolean);

        if (!formatted.length) return;

        dispatch(createManyStudents(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(
              fetchStudents({
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
        previewExportStudents({
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
      exportStudents({
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
  const handleShowAllStudentHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "students" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  /** COMPUTED **/
  const isEmpty = useMemo(
    () => !adminLoading && students.length === 0,
    [adminLoading, students.length]
  );

  const columnsConfig = useMemo(
    () => [
      { key: "user.fullname", label: "Full Name", editableType: "text" },
      { key: "user.email", label: "Email", editableType: "text" },
      { key: "user.phone", label: "Phone", editableType: "text" },
    ],
    []
  );
  const isSubmitting = editStudent
    ? studentLoading.update
    : studentLoading.create;

  return {
    students,

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

    editStudent,
    setEditStudent,

    studentFormModal,
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
    handleShowAllStudentHistory,
    handleCloseLogModal,

    columns,
    columnsConfig,
    recentlyUpdatedIds,

    filters,
    setFilters,
    handlePageChange,
    pendingDeleteIds,

    users,
    preferenceOptions,
    getValueByPath,
    isSubmitting,
  };
};

export default useStudents;
