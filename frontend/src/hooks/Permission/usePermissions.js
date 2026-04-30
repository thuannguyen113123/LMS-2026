import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import {
  fetchPermissions,
  createPermission,
  updatePermission,
  createManyPermissions,
  deleteManyPermissions,
  previewExportPermissions,
  exportPermissions,
} from "../../features/permissions/permissionsThunks";
import {
  clearRecentlyUpdated,
  selectAdminPermissions,
  selectPermissionsAdminLoading,
  selectPermissionsLoading,
  setRecentlyUpdated,
} from "../../features/permissions/permissionsSlice";
import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";

import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";
import { handleImportExcel } from "../../components/utils/exportImportUtils";
import { normalizePermissionFromExcel } from "../../utils/normalizePermissionFromExcel";
import { downloadFile } from "../../helper/downloadFile";
import useModal from "../useModal";
import useDebounce from "../useDebounce";

const usePermissions = () => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  /** UI STATE **/

  const [selected, setSelected] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [editPermission, setEditPermission] = useState(null);
  const [exportType, setExportType] = useState(null);

  const search = params.get("search") || "";
  const categoryParam = params.get("category") ?? "All";

  /** MODALS **/
  const permissionFormModal = useModal("permissionForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** PAGINATION (ADMIN STYLE) **/
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  const filters = useMemo(
    () => ({
      category: categoryParam,
    }),
    [categoryParam]
  );
  const setFilterCategory = useCallback(
    (value) => {
      const v = typeof value === "object" ? value.value : value;

      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (v && v !== "All") next.set("category", v);
        else next.delete("category");

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );
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

  const debouncedSearch = useDebounce(search, 500);

  /** REDUX **/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.permissions
  );
  const adminLoading = useSelector(selectPermissionsAdminLoading);
  const permissionLoading = useSelector(selectPermissionsLoading);
  const { list: logData, isOpen: isLogModalOpen } = useSelector(
    (state) => state.auditLogs
  );

  const recentlyUpdatedIds = useSelector(
    (state) => state.permissions.recentlyUpdatedIds
  );

  const permissions = useSelector(selectAdminPermissions);
  const { totalPages = 1 } = paginationAdmin || {};

  /** FETCH **/
  useEffect(() => {
    dispatch(
      fetchPermissions({
        page,
        limit,
        search: debouncedSearch,
        filters: {
          category: categoryParam !== "All" ? categoryParam : undefined,
        },
      })
    );
  }, [dispatch, page, limit, debouncedSearch, categoryParam]);

  /** PAGINATION **/
  const handleNext = useCallback(() => {
    if (page >= totalPages) return;
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.set("page", page + 1);
      return next;
    });
  }, [page, totalPages, setParams]);

  const handlePrev = useCallback(() => {
    if (page <= 1) return;
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.set("page", page - 1);
      return next;
    });
  }, [page, setParams]);
  const handlePageChange = useCallback(
    (p) => {
      if (p < 1 || p > totalPages) return;

      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", p);
        return next;
      });
    },
    [setParams, totalPages]
  );

  const columns = useMemo(
    () => [
      { header: "Name", key: "name", tooltip: "Tên quyền" },
      { header: "Code", key: "code", tooltip: "Mã code quyền" },
      { header: "ID", key: "id", tooltip: "Mã quyền" },
      { header: "Description", key: "description", tooltip: "Mô tả" },
      {
        header: "Module",
        key: "moduleId",
        path: "moduleId",
        tooltip: "Module liên quan",
      },
      { header: "Category", key: "category", tooltip: "Loại quyền" },
      {
        header: "System",
        key: "isSystemPermission",
        type: "boolean",
        tooltip: "Quyền hệ thống",
      },
    ],
    []
  );

  /** SELECTION **/
  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === permissions.length ? [] : permissions.map((p) => p.id)
    );
  }, [permissions]);

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

    setRecentlyDeleted(
      permissions.filter((p) => pendingDeleteIds.includes(p.id))
    );

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyPermissions(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);
    setSelected([]);
    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, permissions, dispatch, undoTimer, confirmDeleteModal]);

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

  /** FORM **/
  const handleSubmit = useCallback(
    (form) => {
      if (editPermission)
        dispatch(updatePermission({ id: editPermission.id, ...form }));
      else dispatch(createPermission(form));

      permissionFormModal.close();
    },
    [dispatch, editPermission, permissionFormModal]
  );

  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      dispatch(updatePermission({ id: updatedItem.id, ...updatedItem }));

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
          .map(normalizePermissionFromExcel)
          .filter(Boolean);

        if (!formatted.length) return;

        dispatch(createManyPermissions(formatted));
      });
    },
    [dispatch]
  );

  /** EXPORT **/
  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length ? "SELECTED" : "CURRENT_PAGE";

      setExportType(type);

      dispatch(
        previewExportPermissions({
          scope,
          selectedIds: selected,
          filters: {
            search,
            category: categoryParam !== "All" ? categoryParam : undefined,
          },
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") exportPreviewModal.open();
      });
    },
    [dispatch, selected, search, categoryParam, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length ? "SELECTED" : "CURRENT_PAGE";

    dispatch(
      exportPermissions({
        scope,
        selectedIds: selected,
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
  }, [dispatch, exportType, selected, exportPreviewModal]);

  /** AUDIT **/
  const handleShowAllPermissionHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "permissions" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(
    () => dispatch(closeAuditModal()),
    [dispatch]
  );

  const isEmpty = useMemo(
    () => !adminLoading && permissions.length === 0,
    [adminLoading, permissions.length]
  );

  const columnsConfig = useMemo(
    () => [
      { key: "name", label: "Name", editableType: "text" },
      { key: "code", label: "Code", editableType: "text" },
      { key: "description", label: "Description", editableType: "text" },
      {
        key: "category",
        label: "Category",
        editableType: "select",
        options: [
          { value: "read", label: "Đọc (read)" },
          { value: "write", label: "Ghi (write)" },
          { value: "update", label: "Cập nhật (update)" },
          { value: "delete", label: "Xóa (delete)" },
          { value: "admin", label: "Quản trị (admin)" },
          { value: "other", label: "Khác (other)" },
        ],
      },
    ],
    []
  );
  const categoryOptions = useMemo(() => {
    return [
      { label: "Tất cả loại quyền", value: "All" },
      { value: "read", label: "Đọc (read)" },
      { value: "write", label: "Ghi (write)" },
      { value: "update", label: "Cập nhật (update)" },
      { value: "delete", label: "Xóa (delete)" },
      { value: "admin", label: "Quản trị (admin)" },
      { value: "export", label: "export" },
      { value: "other", label: "Khác (other)" },
    ];
  }, []);

  const isSubmitting = editPermission
    ? permissionLoading.update
    : permissionLoading.create;

  return {
    permissions,
    loading: adminLoading,
    error,
    isEmpty,
    columnsConfig,
    categoryOptions,

    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    handleNext,
    handlePrev,

    search,
    setSearch,

    selected,
    handleSelect,
    handleSelectAll,

    editPermission,
    setEditPermission,
    permissionFormModal,

    handleSubmit,
    handleDelete,
    handleDeleteSelected,
    confirmDelete,
    handleUndo,

    handleInlineUpdate,

    onImportExcel,
    handleExportWithPreview,
    handleConfirmExport,

    exportPreviewModal,
    exportPreview,
    previewLoading,

    confirmDeleteModal,
    pendingDeleteIds,
    recentlyDeleted,

    handleShowAllPermissionHistory,
    handleCloseLogModal,

    isLogModalOpen,
    logData,

    filterCategory: categoryParam,
    setFilterCategory,
    filters,
    recentlyUpdatedIds,
    columns,
    handlePageChange,
    isSubmitting,
  };
};

export default usePermissions;
