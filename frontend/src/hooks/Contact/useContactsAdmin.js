import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import useModal from "../useModal";
import useDebounce from "../useDebounce";
import {
  selectAdminContacts,
  selectAdminContactsLoading,
} from "../../features/contact/contactsSlice";
import {
  deleteManyContacts,
  fetchContactsAdmin,
  updateContactStatus,
} from "../../features/contact/contactsThunks";

const useContacts = () => {
  const dispatch = useDispatch();

  /** ================= UI STATE ================= */

  const [selected, setSelected] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  const confirmDeleteModal = useModal("confirmDelete");

  const { errorCode, paginationAdmin } = useSelector((state) => state.contacts);
  const adminLoading = useSelector(selectAdminContactsLoading);

  const contacts = useSelector(selectAdminContacts);
  const { totalPages } = paginationAdmin;

  /** ================= URL PARAMS ================= */

  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);
  const search = params.get("search") || "";

  const statusParamRaw = params.get("status");
  const status = statusParamRaw ?? "All";

  /** ================= FILTERS ================= */

  const filters = useMemo(
    () => ({
      status,
    }),
    [status]
  );

  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (value && value !== "All") next.set(key, value);
          else next.delete(key);
        });

        next.set("page", 1);
        return next;
      });
    },
    [setParams]
  );

  /** ================= SEARCH ================= */

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

  /** ================= FETCH ================= */

  useEffect(() => {
    dispatch(
      fetchContactsAdmin({
        page,
        limit,
        search: debouncedSearch,
        status: filters.status,
      })
    );
  }, [dispatch, page, limit, debouncedSearch, filters]);

  /** ================= PAGINATION ================= */

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

  /** ================= SELECT ================= */

  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === contacts.length ? [] : contacts.map((c) => c.id)
    );
  }, [contacts]);

  /** ================= DELETE (UNDO) ================= */

  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open({ ids });
    },
    [confirmDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteIds.length) return;

    const toDelete = contacts.filter((c) => pendingDeleteIds.includes(c.id));

    setRecentlyDeleted(toDelete);
    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyContacts(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);
    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, contacts, dispatch, undoTimer, confirmDeleteModal]);

  const handleUndo = useCallback(() => {
    if (undoTimer) clearTimeout(undoTimer);
    setRecentlyDeleted([]);
  }, [undoTimer]);

  /** ================= INLINE UPDATE ================= */

  const handleInlineUpdate = useCallback(
    (editData, originalItem) => {
      if (!editData || !originalItem) return;

      // tìm field thay đổi
      const changedKey = Object.keys(editData).find(
        (key) => editData[key] !== originalItem[key]
      );

      if (!changedKey) return;

      const value = editData[changedKey];
      const id = originalItem.id;

      // mapping action theo field
      switch (changedKey) {
        case "status":
          dispatch(updateContactStatus({ id, status: value }));
          break;

        default:
          console.warn("Unhandled inline field:", changedKey);
      }
    },
    [dispatch]
  );
  /** ================= TABLE ================= */

  const columns = useMemo(
    () => [
      { key: "name", header: "Name", path: "name" },
      { key: "email", header: "Email", path: "email" },
      { key: "subject", header: "Subject", path: "subject" },
      {
        key: "status",
        header: "Status",
        path: "status",
        type: "badge",
      },
      {
        key: "createdAt",
        header: "Created At",
        render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN"),
      },
    ],
    []
  );

  /** ✅ INLINE EDIT CONFIG */
  const columnsConfig = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        editableType: "select",
        options: [
          { value: "new", label: "New" },
          { value: "read", label: "Read" },
          { value: "replied", label: "Replied" },
        ],
      },
    ],
    []
  );

  /** ================= DERIVED ================= */

  const isEmpty = useMemo(
    () => !adminLoading && contacts.length === 0,
    [adminLoading, contacts.length]
  );

  const statusOptions = [
    { label: "Tất cả", value: "All" },
    { label: "Mới", value: "new" },
    { label: "Đã đọc", value: "read" },
    { label: "Đã phản hồi", value: "replied" },
  ];

  /** ================= RETURN ================= */

  return {
    contacts,
    columns,
    columnsConfig,
    pendingDeleteIds,

    loading: adminLoading,
    errorCode,
    isEmpty,

    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    handleNext,
    handlePrev,

    search,
    setSearch,

    filters,
    setFilters,
    statusOptions,

    selected,
    handleSelect,
    handleSelectAll,

    confirmDelete,
    confirmDeleteModal,

    recentlyDeleted,
    handleUndo,

    handleInlineUpdate,
    openConfirmDelete,
  };
};

export default useContacts;
