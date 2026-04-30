import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";

import {
  fetchUsers,
  createUser,
  createManyUsers,
  deleteManyUsers,
  adminFormUpdate,
  adminInlineUpdate,
  previewExportUsers,
  exportUsers,
} from "../../features/users/usersThunks";

import {
  clearRecentlyUpdated,
  selectAdminUsers,
  selectUsersAdminLoading,
  selectUsersLoading,
  setRecentlyUpdated,
} from "../../features/users/usersSlice";

import { handleImportExcel } from "../../components/utils/exportImportUtils";

import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";

import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";

import { normalizeUserFromExcel } from "../../utils/normalizeUserFromExcel";
import { downloadFile } from "../../helper/downloadFile";
import { useSearchParams } from "react-router-dom";
import useModal from "../useModal";
import useDebounce from "../useDebounce";

const useUsers = () => {
  const dispatch = useDispatch();

  /** UI STATE **/
  const [selected, setSelected] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [exportType, setExportType] = useState(null);

  /** MODALS **/
  const userFormModal = useModal("userForm");
  const confirmDeleteModal = useModal("confirmDeleteUser");
  const exportPreviewModal = useModal("exportPreviewUser");

  /** REDUX STATE **/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.users
  );

  const adminLoading = useSelector(selectUsersAdminLoading);
  const userLoading = useSelector(selectUsersLoading);

  const recentlyUpdatedIds = useSelector(
    (state) => state.users.recentlyUpdatedIds
  );

  const users = useSelector(selectAdminUsers);

  const { totalPages } = paginationAdmin;

  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /** URL PARAMS PAGINATION **/

  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);

  const limit = Number(params.get("limit") || 10);

  const search = params.get("search") || "";
  const roleParamRaw = params.get("role");
  const filterRoleId = roleParamRaw ?? "All";
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
  const setFilterRoleId = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (value !== "All") next.set("role", value);
        else next.delete("role");

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );

  const debouncedSearch = useDebounce(search, 500);

  /** FETCH USERS **/

  useEffect(() => {
    dispatch(
      fetchUsers({
        page,
        limit,
        role: filterRoleId !== "All" ? filterRoleId : undefined,
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, filterRoleId, debouncedSearch]);

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

  /** COLUMNS **/

  const columns = useMemo(
    () => [
      { header: "Full Name", key: "fullname", path: "fullname" },
      { header: "Email", key: "email", path: "email" },
      { header: "Phone", key: "phone", path: "phone" },
      { header: "Role", key: "role", path: "role.name" },
      {
        header: "Status",
        key: "isActive",
        path: "isActive",
        type: "boolean",
      },
      {
        header: "Verified",
        key: "verified",
        path: "verified",
        type: "boolean",
      },
      {
        header: "Locked",
        key: "locked",
        path: "locked",
        type: "boolean",
      },
      {
        header: "Last Login",
        key: "lastLogin",
        path: "lastLogin",

        render: (item) => new Date(item.lastLogin).toLocaleDateString("vi-VN"),
      },
      {
        header: "Created At",
        key: "createdAt",
        path: "createdAt",

        render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN"),
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
      prev.length === users.length ? [] : users.map((u) => u.id)
    );
  }, [users]);

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

    const toDelete = users.filter((u) => pendingDeleteIds.includes(u.id));
    setRecentlyDeleted(toDelete);
    setSelected([]);
    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyUsers(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);

    confirmDeleteModal.close();
  }, [pendingDeleteIds, users, confirmDeleteModal, dispatch, undoTimer]);

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
      if (editUser) {
        dispatch(
          adminFormUpdate({
            userId: editUser.id,
            data: form,
          })
        );
      } else {
        dispatch(createUser(form));
      }

      userFormModal.close();
    },
    [dispatch, editUser, userFormModal]
  );

  /** INLINE UPDATE **/
  const handleInlineUpdate = useCallback(
    (updatedItem, originalItem) => {
      const patch = {};

      ["role_id", "isActive", "locked"].forEach((k) => {
        if (updatedItem[k] !== originalItem[k]) {
          patch[k] = updatedItem[k];
        }
      });

      if (!Object.keys(patch).length) return;

      dispatch(
        adminInlineUpdate({
          userId: updatedItem.id,
          patch,
        })
      );
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
        const formatted = rows.map(normalizeUserFromExcel).filter(Boolean);

        if (formatted.length === 0) return;

        dispatch(createManyUsers(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(
              fetchUsers({
                page: 1,
                limit,
                role: filterRoleId !== "All" ? filterRoleId : undefined,
                search: debouncedSearch,
              })
            );
          }
        });
      });
    },
    [dispatch, limit, filterRoleId, debouncedSearch]
  );

  /** EXPORT **/

  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportUsers({
          scope,
          selectedIds: selected,
          filters: {
            search,
            roleId: filterRoleId !== "All" ? filterRoleId : undefined,
          },
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          exportPreviewModal.open();
        }
      });
    },
    [dispatch, selected, search, filterRoleId, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportUsers({
        scope,
        selectedIds: selected,
        filters: {
          search,
          roleId: filterRoleId !== "All" ? filterRoleId : undefined,
        },
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
  }, [
    dispatch,
    exportType,
    selected,
    search,
    filterRoleId,
    exportPreviewModal,
  ]);

  /** AUDIT LOG **/

  const handleShowAllUserHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "users" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  /** EMPTY STATE **/

  const isEmpty = useMemo(
    () => !adminLoading && users.length === 0,
    [adminLoading, users.length]
  );
  const isSubmitting = editUser ? userLoading.update : userLoading.create;

  return {
    users,

    columns,

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

    editUser,
    setEditUser,

    userFormModal,
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

    handleShowAllUserHistory,
    handleCloseLogModal,

    recentlyUpdatedIds,

    filterRoleId,
    setFilterRoleId,

    pendingDeleteIds,
    isSubmitting,
  };
};

export default useUsers;
