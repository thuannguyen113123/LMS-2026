import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import {
  fetchOrders,
  createOrder,
  updateOrder,
  createManyOrders,
  deleteManyOrders,
  previewExportOrders,
  exportOrders,
} from "../../../features/orders/ordersThunks";
import {
  clearRecentlyUpdated,
  selectAdminOrders,
  selectAdminOrdersLoading,
  setRecentlyUpdated,
} from "../../../features/orders/ordersSlice";
import { handleImportExcel } from "../../../components/utils/exportImportUtils";
import {
  openAuditModal,
  closeAuditModal,
} from "../../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../../features/auditLog/auditLogThunks";
import { normalizeOrderFromExcel } from "../../../utils/normalizeOrderFromExcel";
import { downloadFile } from "../../../helper/downloadFile";
import useModal from "../../useModal";
import useDebounce from "../../useDebounce";

const exportColumnMeta = {
  id: { label: "Order ID" },
  user: { label: "User" },
  itemsCount: { label: "Items" },
  subtotal: { label: "Subtotal" },
  discountValue: { label: "Discount" },
  finalAmount: { label: "Final Amount" },
  couponCode: { label: "Coupon Code" },
  payment: { label: "Payment ID" },
  status: { label: "Status" },
  createdAt: { label: "Created At" },
  updatedAt: { label: "Updated At" },
};

const useOrders = () => {
  const dispatch = useDispatch();

  const [params, setParams] = useSearchParams();

  /** UI STATE **/

  const [selected, setSelected] = useState([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [exportType, setExportType] = useState(null);

  /** MODALS **/
  const orderFormModal = useModal("orderForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** REDUX **/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.orders
  );
  const adminLoading = useSelector(selectAdminOrdersLoading);

  const orders = useSelector(selectAdminOrders);

  const { totalPages } = paginationAdmin;

  /** URL PAGINATION **/
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  const search = params.get("search") || "";

  const debouncedSearch = useDebounce(search, 500);

  /** FILTER STATE **/
  const filters = useMemo(() => {
    return {
      status: params.get("status") || "all",
      type: params.get("type") || "all",
      sort: params.get("sort") || "default",
    };
  }, [params]);
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
  const filterStatus = filters.status;
  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (!value || value === "all" || value === "default") {
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
  const setFilterStatus = useCallback(
    (value) => {
      setFilters({ status: value });
    },
    [setFilters]
  );

  /** AUDIT LOG **/
  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  const recentlyUpdatedIds = useSelector(
    (state) => state.orders.recentlyUpdatedIds
  );

  /** FETCH **/
  useEffect(() => {
    const cleanFilters = {};

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "all" && v !== "default") {
        cleanFilters[k] = v;
      }
    });

    dispatch(
      fetchOrders({
        page,
        limit,
        filters: cleanFilters,
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

  /** COLUMNS **/
  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "Order ID",
        path: "id",
        tooltip: "Mã định danh của đơn hàng.",
      },

      {
        key: "user",
        header: "User",
        path: "user.fullname",
        tooltip: "Người tạo đơn hàng.",
        render: (item) => item.user?.fullname || "-",
      },

      {
        key: "itemsCount",
        header: "Items",
        path: "itemsCount",
        tooltip: "Số lượng khóa học trong đơn.",
      },

      {
        key: "subtotal",
        header: "Subtotal",
        path: "subtotal",
        render: (item) => item.subtotal?.toLocaleString("vi-VN") || "-",
      },

      {
        key: "discountValue",
        header: "Discount",
        path: "discountValue",
        render: (item) =>
          item.discountValue ? item.discountValue.toLocaleString("vi-VN") : "0",
      },

      {
        key: "finalAmount",
        header: "Final Amount",
        path: "finalAmount",
        render: (item) => item.finalAmount?.toLocaleString("vi-VN") || "-",
      },

      {
        key: "couponCode",
        header: "Coupon",
        path: "couponCode",
        render: (item) => item.couponCode || "-",
      },

      {
        key: "payment",
        header: "Payment ID",
        path: "payment.id",
        render: (item) => item.payment?.id || "-",
      },

      {
        key: "status",
        header: "Status",
        path: "status",
        type: "status",
      },

      {
        key: "createdAt",
        header: "Created",
        path: "createdAt",
        render: (item) => new Date(item.createdAt).toLocaleString("vi-VN"),
      },

      {
        key: "updatedAt",
        header: "Updated",
        path: "updatedAt",
        render: (item) =>
          item.updatedAt
            ? new Date(item.updatedAt).toLocaleString("vi-VN")
            : "-",
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
      prev.length === orders.length ? [] : orders.map((o) => o.id)
    );
  }, [orders]);

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

    const toDelete = orders.filter((o) => pendingDeleteIds.includes(o.id));

    setRecentlyDeleted(toDelete);

    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyOrders(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, orders, confirmDeleteModal, dispatch, undoTimer]);

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
      if (editOrder) {
        dispatch(updateOrder({ id: editOrder.id, ...form }));
      } else {
        dispatch(createOrder(form));
      }

      orderFormModal.close();
    },
    [dispatch, editOrder, orderFormModal]
  );

  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      dispatch(updateOrder({ id: updatedItem.id, ...updatedItem }));

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
          .map((row) => normalizeOrderFromExcel(row))
          .filter(Boolean);

        if (formatted.length === 0) return;

        dispatch(createManyOrders(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(
              fetchOrders({
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
        previewExportOrders({
          scope,
          selectedIds: selected,
          filters,
          search: debouncedSearch,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          exportPreviewModal.open();
        }
      });
    },
    [dispatch, selected, filters, debouncedSearch, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportOrders({
        scope,
        selectedIds: selected,
        filters,
        search: debouncedSearch,
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
    filters,
    debouncedSearch,
    exportPreviewModal,
  ]);

  /** AUDIT **/
  const handleShowAllOrderHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "orders" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  const isEmpty = useMemo(
    () => !adminLoading && orders.length === 0,
    [adminLoading, orders.length]
  );

  const columnsConfig = useMemo(
    () => [
      {
        key: "id",
        label: "Order ID",
        editable: false,
      },

      {
        key: "user",
        label: "User",
        editable: false,
      },

      {
        key: "subtotal",
        label: "Subtotal",
        editable: false,
      },

      {
        key: "finalAmount",
        label: "Final Amount",
        editable: false,
      },

      {
        key: "status",
        label: "Status",
        editableType: "select",
        options: [
          { label: "Pending", value: "pending" },
          { label: "Paid", value: "paid" },
          { label: "Cancelled", value: "cancelled" },
        ],
      },

      {
        key: "createdAt",
        label: "Created At",
        editable: false,
      },
    ],
    []
  );
  const previewColumns = useMemo(() => {
    if (!exportPreview?.columns) return [];

    return exportPreview.columns.map((key) => ({
      key,
      header: exportColumnMeta[key]?.label || key,
      path: key,
    }));
  }, [exportPreview?.columns]);

  return {
    orders,

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

    editOrder,
    setEditOrder,

    orderFormModal,
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
    handleShowAllOrderHistory,
    handleCloseLogModal,

    columns,
    columnsConfig,

    recentlyUpdatedIds,

    filters,
    setFilters,

    handlePageChange,

    pendingDeleteIds,
    filterStatus,
    setFilterStatus,
    previewColumns,
  };
};

export default useOrders;
