import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import useModal from "../useModal";
import useDebounce from "../useDebounce";

import {
  fetchModules,
  createModule,
  updateModule,
  deleteManyModules,
  toggleModuleActive,
  updateModuleOrder,
  previewExportModules,
  exportModules,
} from "../../features/modules/modulesThunks";

import {
  clearRecentlyUpdated,
  selectAdminModules,
  selectAdminModulesLoading,
  selectModulesLoading,
} from "../../features/modules/modulesSlice";

import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";

import { downloadFile } from "../../helper/downloadFile";

const useModules = () => {
  const dispatch = useDispatch();

  /* ================= URL PAGINATION ================= */

  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  /* ================= UI STATE ================= */

  const [selected, setSelected] = useState([]);
  const [editModule, setEditModule] = useState(null);

  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  const [exportType, setExportType] = useState(null);

  /* ================= MODALS ================= */

  const moduleFormModal = useModal("moduleForm");
  const confirmDeleteModal = useModal("moduleConfirmDelete");
  const exportPreviewModal = useModal("moduleExportPreview");

  /* ================= REDUX ================= */

  const { errorCode, exportPreview, previewLoading, paginationAdmin } =
    useSelector((state) => state.modules);

  const adminLoading = useSelector(selectAdminModulesLoading);
  const modulesLoading = useSelector(selectModulesLoading);

  const recentlyUpdatedIds = useSelector(
    (state) => state.modules.recentlyUpdatedIds
  );

  const modules = useSelector(selectAdminModules);

  const { totalPages } = paginationAdmin;

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);
  const isActiveParam = params.get("isActive") ?? "All";
  const isSystemModuleParam = params.get("isSystemModule") ?? "All";
  const search = params.get("search") || "";

  const filters = useMemo(
    () => ({
      isActive: isActiveParam,
      isSystemModule: isSystemModuleParam,
    }),
    [isActiveParam, isSystemModuleParam]
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

  /* ================= FETCH ================= */

  useEffect(() => {
    dispatch(
      fetchModules({
        page,
        limit,
        filters,
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, filters, debouncedSearch]);

  /* ================= PAGINATION ================= */

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

  /* ================= SELECT ================= */

  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === modules.length ? [] : modules.map((m) => m.id)
    );
  }, [modules]);

  /* ================= CRUD ================= */

  const handleSubmit = useCallback(
    (form) => {
      if (editModule) {
        dispatch(updateModule({ id: editModule.id, ...form }));
      } else {
        dispatch(createModule(form));
      }
      moduleFormModal.close();
    },
    [dispatch, editModule, moduleFormModal]
  );

  const handleInlineUpdate = useCallback(
    (updated) => {
      dispatch(updateModule({ id: updated.id, ...updated }));
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

  const handleToggleActive = useCallback(
    (module) => {
      dispatch(
        toggleModuleActive({
          id: module.id,
          isActive: !module.isActive,
        })
      );
    },
    [dispatch]
  );

  /* ================= DELETE + UNDO ================= */

  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open();
    },
    [confirmDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteIds.length) return;

    const toDelete = modules.filter((m) => pendingDeleteIds.includes(m.id));

    setRecentlyDeleted(toDelete);
    setSelected([]);

    const timer = setTimeout(() => {
      dispatch(deleteManyModules(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);
    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, modules, dispatch, confirmDeleteModal]);
  const handleDelete = useCallback(
    (id) => {
      openConfirmDelete([id]);
    },
    [openConfirmDelete]
  );
  const handleDeleteSelected = useCallback(() => {
    if (!selected.length) return;
    openConfirmDelete(selected);
  }, [selected, openConfirmDelete]);

  const handleUndo = useCallback(() => {
    if (undoTimer) clearTimeout(undoTimer);
    setRecentlyDeleted([]);
  }, [undoTimer]);

  /* ================= ORDER ================= */

  const handleUpdateOrder = useCallback(
    (items) => {
      dispatch(updateModuleOrder(items));
    },
    [dispatch]
  );

  /* ================= EXPORT ================= */

  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportModules({
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
      exportModules({
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

  /* ================= AUDIT ================= */

  const handleShowAllModuleHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "modules" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  /* ================= COMPUTED ================= */

  const isEmpty = useMemo(
    () => !adminLoading && modules.length === 0,
    [adminLoading, modules.length]
  );
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        path: "name",
        tooltip: "Tên module hiển thị trong hệ thống.",
      },
      {
        key: "code",
        header: "Code",
        path: "code",
        tooltip: "Mã định danh duy nhất của module.",
      },
      {
        key: "slug",
        header: "Slug",
        path: "slug",
        tooltip: "Slug dùng cho routing hoặc URL.",
      },
      {
        key: "order",
        header: "Order",
        path: "order",
        tooltip: "Thứ tự hiển thị của module trong menu.",
      },
      {
        key: "visibility",
        header: "Visibility",
        path: "visibility",
        tooltip: "Context hiển thị module.",
      },

      {
        key: "isActive",
        header: "Active",
        path: "isActive",
        type: "boolean",
        tooltip: "Trạng thái kích hoạt của module.",
      },
      {
        key: "isSystemModule",
        header: "System",
        path: "isSystemModule",
        type: "boolean",
        tooltip: "Xác định module có phải module hệ thống hay không.",
      },
    ],
    []
  );
  const systemModuleOptions = [
    { label: "Tất cả", value: "All" },
    { label: "System module", value: "true" },
    { label: "Custom module", value: "false" },
  ];
  const columnsConfig = useMemo(
    () => [
      { key: "name", label: "Name", editableType: "text" },
      { key: "code", label: "Code", editableType: "text" },
      { key: "slug", label: "Slug", editableType: "text" },
      { key: "order", label: "Order", editableType: "number" },
      {
        key: "isActive",
        label: "Active",
        editableType: "select",
        options: [
          { label: "Active", value: true },
          { label: "Inactive", value: false },
        ],
      },
      {
        key: "visibility",
        label: "Visibility",
        editableType: "select",
        options: [
          { label: "Admin", value: "admin" },
          { label: "Public", value: "public" },
          { label: "Both", value: "both" },
        ],
      },

      {
        key: "isSystemModule",
        label: "System",
        editableType: "select",
        options: [
          { label: "System", value: true },
          { label: "Custom", value: false },
        ],
      },
    ],
    []
  );
  const isSubmitting = editModule
    ? modulesLoading.update
    : modulesLoading.create;

  /* ================= RETURN ================= */

  return {
    modules,

    loading: adminLoading,
    errorCode,
    isEmpty,

    page,
    totalPages,
    handleNext,
    handlePrev,
    handlePageChange,

    search,
    setSearch,
    filters,
    setFilters,

    selected,
    handleSelect,
    handleSelectAll,

    editModule,
    setEditModule,
    moduleFormModal,
    confirmDeleteModal,

    handleSubmit,
    handleInlineUpdate,
    handleToggleActive,

    confirmDelete,
    handleUndo,
    recentlyDeleted,

    handleUpdateOrder,

    exportPreviewModal,
    exportPreview,
    previewLoading,
    handleExportWithPreview,
    handleConfirmExport,

    logData,
    isLogModalOpen,
    logLoading,
    handleShowAllModuleHistory,
    handleCloseLogModal,
    openConfirmDelete,
    columns,
    columnsConfig,
    systemModuleOptions,
    recentlyUpdatedIds,
    handleDelete,
    handleDeleteSelected,
    pendingDeleteIds,
    isSubmitting,
  };
};

export default useModules;
