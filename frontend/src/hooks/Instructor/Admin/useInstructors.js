import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { handleImportExcel } from "../../../components/utils/exportImportUtils";

import {
  openAuditModal,
  closeAuditModal,
} from "../../../features/auditLog/auditLogSlice";

import { fetchAuditLogs } from "../../../features/auditLog/auditLogThunks";

import useModal from "../../useModal";
import useDebounce from "../../useDebounce";

import {
  createInstructor,
  createManyInstructors,
  deleteManyInstructors,
  exportInstructors,
  fetchInstructorFilterOptions,
  fetchInstructors,
  previewExportInstructors,
  updateInstructor,
} from "../../../features/instructor/instructorsThunks";

import {
  clearRecentlyUpdated,
  selectAdminInstructors,
  selectAdminInstructorsLoading,
  selectInstructorExpertiseOptions,
  selectInstructorLoading,
  setRecentlyUpdated,
} from "../../../features/instructor/instructorsSlice";

import { normalizeInstructorFromExcel } from "../../../utils/normalizeInstructorFromExcel";
import { downloadFile } from "../../../helper/downloadFile";
import useUsers from "../../User/useUser";

const exportInstructorColumnMeta = {
  fullname: {
    label: "Full Name",
    path: "user.fullname",
  },
  email: {
    label: "Email",
    path: "user.email",
  },
  phone: {
    label: "Phone",
    path: "user.phone",
  },
  expertise: {
    label: "Expertise",
    path: "expertise",
  },
  totalStudents: {
    label: "Total Students",
    path: "totalStudents",
  },
  ratingAverage: {
    label: "Rating Average",
    path: "rating.average",
  },
  ratingCount: {
    label: "Rating Count",
    path: "rating.count",
  },
  createdAt: {
    label: "Created At",
    path: "createdAt",
  },
  updatedAt: {
    label: "Updated At",
    path: "updatedAt",
  },
};

const useInstructors = () => {
  const dispatch = useDispatch();

  const [selected, setSelected] = useState([]);

  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  const [editInstructor, setEditInstructor] = useState(null);
  const [exportType, setExportType] = useState(null);

  const recentlyUpdatedIds = useSelector(
    (state) => state.instructors.recentlyUpdatedIds
  );

  /** MODALS **/
  const instructorFormModal = useModal("instructorForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** URL PAGINATION **/
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const debouncedSearch = useDebounce(search, 500);

  const setSearch = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (value) next.set("search", value);
        else next.delete("search");

        next.set("page", 1); // reset page khi search

        return next;
      });
    },
    [setParams]
  );

  const filters = useMemo(() => {
    return {
      expertise: params.get("expertise") || "",
      sort: params.get("sort") || "default",
    };
  }, [params]);

  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (value) next.set(key, value);
          else next.delete(key);
        });

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  /** REDUX STATE **/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.instructors
  );
  const adminLoading = useSelector(selectAdminInstructorsLoading);
  const instructorLoading = useSelector(selectInstructorLoading);

  const { totalPages } = paginationAdmin;

  const instructors = useSelector(selectAdminInstructors);

  const expertiseList = useSelector(selectInstructorExpertiseOptions);

  useEffect(() => {
    dispatch(fetchInstructorFilterOptions());
  }, [dispatch]);

  const expertiseOptions = useMemo(
    () =>
      expertiseList.map((e) => ({
        label: e,
        value: e,
      })),
    [expertiseList]
  );

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  const { users } = useUsers();

  /** FETCH **/
  useEffect(() => {
    dispatch(
      fetchInstructors({
        page,
        limit,
        expertise: filters.expertise,
        search: debouncedSearch,
        sort: filters.sort,
      })
    );
  }, [dispatch, page, limit, filters, debouncedSearch]);

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

  /** PAGINATION **/
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
        header: "Name",
        path: "user.fullname",
        tooltip: "Tên đầy đủ của instructor.",
      },
      {
        key: "email",
        header: "Email",
        path: "user.email",
        tooltip: "Email liên hệ của instructor.",
      },
      {
        key: "phone",
        header: "Phone",
        path: "user.phone",
        tooltip: "Số điện thoại của instructor.",
      },
      {
        key: "expertise",
        header: "Expertise",
        path: "expertise",
        tooltip: "Danh sách lĩnh vực chuyên môn của instructor.",
      },
      {
        key: "totalStudents",
        header: "Total Students",
        path: "totalStudents",
        tooltip: "Tổng số học viên đã học các khóa của instructor.",
      },
      {
        key: "createdAt",
        header: "Created At",
        path: "createdAt",
        tooltip: "Thời điểm instructor được tạo trong hệ thống.",
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
      prev.length === instructors.length ? [] : instructors.map((i) => i.id)
    );
  }, [instructors]);

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

    setRecentlyDeleted(pendingDeleteIds);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyInstructors(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, dispatch, confirmDeleteModal, undoTimer]);

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
      if (editInstructor) {
        dispatch(updateInstructor({ id: editInstructor.id, ...form }));
      } else {
        dispatch(createInstructor(form));
      }

      instructorFormModal.close();
    },
    [dispatch, editInstructor, instructorFormModal]
  );

  /** INLINE UPDATE **/
  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      dispatch(updateInstructor({ id: updatedItem.id, ...updatedItem }));

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
        const formatted = rows
          .map((r) => normalizeInstructorFromExcel(r))
          .filter(Boolean);

        if (!formatted.length) return;

        dispatch(createManyInstructors(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(
              fetchInstructors({
                page: 1,
                limit,
                expertise: filters.expertise,
                search: debouncedSearch,
                sort: filters.sort,
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
        previewExportInstructors({
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
      exportInstructors({
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
  const handleShowAllInstructorHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "instructors" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  /** COMPUTED **/
  const isEmpty = useMemo(
    () => !adminLoading && instructors.length === 0,
    [adminLoading, instructors.length]
  );

  const handleSelectExpertise = (value) => {
    setFilters({ expertise: value });
  };

  const previewColumns = useMemo(() => {
    if (!exportPreview?.columns) return [];

    return exportPreview.columns.map((key) => ({
      key,
      header: exportInstructorColumnMeta[key]?.label || key,
      path: key,
    }));
  }, [exportPreview?.columns]);

  const isSubmitting = editInstructor
    ? instructorLoading.update
    : instructorLoading.create;

  return {
    instructors,
    columns,
    loading: adminLoading,
    error,
    isEmpty,

    page,
    totalPages,
    handleNext,
    handlePrev,

    search,
    setSearch,

    filters,
    setFilters,

    selected,
    handleSelect,
    handleSelectAll,

    editInstructor,
    setEditInstructor,

    instructorFormModal,
    confirmDeleteModal,

    openConfirmDelete,
    handleDelete,
    handleDeleteSelected,
    confirmDelete,
    recentlyDeleted,
    handleUndo,

    handleSubmit,
    handleInlineUpdate,

    onImportExcel,

    exportPreviewModal,
    exportPreview,
    previewLoading,

    handleExportWithPreview,
    handleConfirmExport,

    logData,
    isLogModalOpen,
    logLoading,

    handleShowAllInstructorHistory,
    handleCloseLogModal,

    columnsConfig: [
      {
        key: "bio",
        label: "Bio",
        editableType: "textarea",
      },
      {
        key: "expertise",
        label: "Expertise",
        editableType: "tags",
      },
      {
        key: "socialLinks.website",
        label: "Website",
        editableType: "text",
      },
    ],
    previewColumns,

    recentlyUpdatedIds,
    users,

    expertiseOptions,
    handleSelectExpertise,
    handlePageChange,
    isSubmitting,
  };
};

export default useInstructors;
