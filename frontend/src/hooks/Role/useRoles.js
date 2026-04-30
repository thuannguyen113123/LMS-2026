import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useModal from "../useModal";
import {
  clearRecentlyUpdated,
  selectAdminRoles,
  selectRolesAdminLoading,
  selectRolesLoading,
  setRecentlyUpdated,
} from "../../features/roles/roleSlice";
import { useSearchParams } from "react-router-dom";
import useDebounce from "../useDebounce";
import {
  createManyRoles,
  createRole,
  deleteManyRoles,
  exportRoles,
  fetchRoles,
  previewExportRoles,
  updateRole,
} from "../../features/roles/roleThunks";
import { handleImportExcel } from "../../components/utils/exportImportUtils";
import { normalizeRoleFromExcel } from "./../../utils/normalizeRoleFromExcel";
import { downloadFile } from "../../helper/downloadFile";
import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";
import {
  closeAuditModal,
  openAuditModal,
} from "../../features/auditLog/auditLogSlice";

const useRoles = () => {
  const dispatch = useDispatch();
  //State UI
  const [selected, setSelected] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [exportType, setExportType] = useState(null);

  //Modal
  const roleFormModal = useModal("roleForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  //redux
  const { error, paginationAdmin, exportPreview, previewLoading } = useSelector(
    (state) => state.roles
  );
  const adminLoading = useSelector(selectRolesAdminLoading);

  const recentlyUpdatedIds = useSelector(
    (state) => state.roles.recentlyUpdatedIds
  );

  const roles = useSelector(selectAdminRoles);

  const roleLoading = useSelector(selectRolesLoading);

  const { totalPages } = paginationAdmin;

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);
  const search = params.get("search") || "";

  const isSystemRoleParamRaw = params.get("isSystemRole");

  const isSystemRoleParam = isSystemRoleParamRaw ?? "All";

  const filters = useMemo(
    () => ({ isSystemRole: isSystemRoleParam }),
    [isSystemRoleParam]
  );

  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== "All") {
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

  const setSearch = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);

      if (value) next.set("search", value);
      else next.delete("search");

      next.set("page", 1);

      return next;
    });
  };

  const debouncedSearch = useDebounce(search, 500);
  useEffect(() => {
    return () => {
      if (undoTimer) clearTimeout(undoTimer);
    };
  }, [undoTimer]);

  //Fetch
  useEffect(() => {
    dispatch(
      fetchRoles({
        page,
        limit,
        filters,
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, filters, debouncedSearch]);

  // Next-Prev
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

  //Bảng render ra dữ liệu
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Role Name",
        path: "name",
        tooltip: "Tên của vai trò trong hệ thống.",
      },
      {
        key: "description",
        header: "Description",
        path: "description",
        tooltip: "Mô tả chức năng hoặc phạm vi của vai trò.",
      },
      {
        key: "isSystemRole",
        header: "System Role",
        path: "isSystemRole",
        type: "boolean",
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

  const columnsConfig = useMemo(
    () => [
      { key: "name", label: "Role Name", editableType: "text" },
      { key: "description", label: "Description", editableType: "text" },
      {
        key: "isSystemRole",
        label: "System Role",
        editableType: "select",
        options: [
          { value: true, label: "System" },
          { value: false, label: "Custom" },
        ],
      },
    ],
    []
  );

  /** ================= SELECT ================= */

  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === roles.length ? [] : roles.map((r) => r.id)
    );
  }, [roles]);

  /** ================= DELETE ================= */

  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open({ ids });
    },
    [confirmDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteIds.length) return;

    const toDelete = roles.filter((r) => pendingDeleteIds.includes(r.id));

    setRecentlyDeleted(toDelete);
    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyRoles(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);
    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, roles, dispatch, undoTimer, confirmDeleteModal]);

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

  /** ================= FORM ================= */

  const handleSubmit = useCallback(
    (form) => {
      if (editRole) dispatch(updateRole({ id: editRole.id, ...form }));
      else dispatch(createRole(form));

      roleFormModal.close();
    },
    [dispatch, editRole, roleFormModal]
  );
  const handleInlineUpdate = useCallback(
    (payload) => {
      dispatch(updateRole(payload));
      dispatch(setRecentlyUpdated(payload.id));
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
  /** ================= IMPORT ================= */
  const onImportExcel = useCallback(
    (e) => {
      handleImportExcel(e, (rows) => {
        const formatted = rows
          .map(normalizeRoleFromExcel)
          .filter((r) => r.name);

        if (!formatted.length) return;

        dispatch(createManyRoles(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            setParams((prev) => {
              const next = new URLSearchParams(prev);

              next.set("page", 1);
              next.delete("search");

              return next;
            });
          }
        });
      });
    },
    [dispatch, setParams]
  );

  /** ================= EXPORT ================= */
  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);
      dispatch(
        previewExportRoles({
          scope,
          selectedIds: selected,
          filters,
          search,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") exportPreviewModal.open();
      });
    },
    [dispatch, selected, search, filters, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportRoles({
        scope,
        selectedIds: selected,
        filters,
        search,
        format: exportType,
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        const { blob, fileName, contentType } = res.payload;
        downloadFile(blob, fileName, contentType);
      }
    });

    exportPreviewModal.close();
    setExportType(null);
  }, [dispatch, exportType, selected, search, filters, exportPreviewModal]);

  /** ================= AUDIT ================= */

  const handleShowAllRoleHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "roles" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  const isEmpty = useMemo(
    () => !adminLoading && roles.length === 0,
    [adminLoading, roles.length]
  );

  const isSystemRoleOptions = [
    { label: "Tất cả", value: "All" },
    { label: "Vai trò hệ thống", value: "true" },
    { label: "Vai trò tùy chỉnh", value: "false" },
  ];
  const isSubmitting = editRole ? roleLoading.update : roleLoading.create;

  return {
    roles,
    columns,
    columnsConfig,

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

    editRole,
    setEditRole,
    roleFormModal,

    handleSubmit,
    handleDelete,
    handleDeleteSelected,
    confirmDelete,
    confirmDeleteModal,

    recentlyDeleted,
    handleUndo,
    pendingDeleteIds,

    handleInlineUpdate,
    recentlyUpdatedIds,

    onImportExcel,
    handleExportWithPreview,
    handleConfirmExport,
    exportPreviewModal,
    exportPreview,
    previewLoading,

    handleShowAllRoleHistory,
    handleCloseLogModal,
    isLogModalOpen,
    logData,
    logLoading,

    handlePageChange,
    isSystemRoleOptions,
    setFilters,
    filters,
    isSubmitting,
  };
};

export default useRoles;
