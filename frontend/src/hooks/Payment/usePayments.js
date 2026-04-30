import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  selectAdminPayments,
  selectAdminPaymentsLoading,
} from "../../features/payments/paymentsSlice";
import { handleImportExcel } from "../../components/utils/exportImportUtils";
import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";
import useModal from "../useModal";
import useDebounce from "../useDebounce";
import {
  createPayment,
  deleteManyPayments,
  exportPayments,
  fetchPayments,
  previewExportPayments,
  updatePayment,
} from "../../features/payments/paymentsThunks";
import { downloadFile } from "../../helper/downloadFile";

export const paymentExportColumnMeta = {
  paymentNumber: {
    label: "Payment No",
    align: "left",
  },

  user: {
    label: "User",
    align: "left",
  },

  orderNumber: {
    label: "Order",
    align: "left",
  },

  gateway: {
    label: "Gateway",
    align: "center",
  },

  status: {
    label: "Status",
    type: "status",
    align: "center",
  },

  amount: {
    label: "Amount",
    align: "right",
    format: "currency",
  },

  currency: {
    label: "Currency",
    align: "center",
  },

  createdAt: {
    label: "Created At",
    type: "datetime",
    align: "center",
  },
};

const usePayments = () => {
  const dispatch = useDispatch();

  /*** URL PARAMS ***/
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  /*** UI STATE ***/

  const [selected, setSelected] = useState([]);

  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  const [exportType, setExportType] = useState(null);

  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState([]);

  /*** MODALS ***/
  const paymentFormModal = useModal("paymentForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /*** REDUX STATE ***/
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.payments
  );
  const adminLoading = useSelector(selectAdminPaymentsLoading);
  const { totalPages } = paginationAdmin;

  const payments = useSelector(selectAdminPayments);
  const search = params.get("search") || "";

  const filters = useMemo(() => {
    return {
      status: params.get("status") || "all",
    };
  }, [params]);
  const filterStatus = filters.status;
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
  const debouncedSearch = useDebounce(search, 400);
  const setFilterStatus = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (!value || value === "all") {
          next.delete("status");
        } else {
          next.set("status", value);
        }

        next.set("page", 1);

        return next;
      });
    },
    [setParams]
  );
  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  /*** FETCH DATA ***/
  useEffect(() => {
    dispatch(
      fetchPayments({
        page,
        limit,
        filters: {
          status: filters.status === "all" ? "" : filters.status,
        },
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, filters.status, debouncedSearch]);

  /*** PAGINATION ***/
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

  /*** TABLE COLUMNS ***/
  const columns = useMemo(
    () => [
      {
        key: "paymentNumber",
        header: "Payment No",
        path: "paymentNumber",
        tooltip: "Mã thanh toán của hệ thống",
      },
      {
        key: "orderId",
        header: "Order",
        path: "order.id",
        tooltip: "ID đơn hàng liên quan",
      },
      {
        key: "userId",
        header: "User",
        path: "user.fullname",
        tooltip: "ID người thanh toán",
      },
      {
        key: "amount",
        header: "Amount",
        path: "transaction.amount",
        tooltip: "Số tiền thanh toán",
      },

      {
        key: "paymentMethod",
        header: "Payment Method",
        path: "transaction.paymentMethod",
        tooltip: "Phương thức thanh toán",
      },

      {
        key: "status",
        header: "Status",
        path: "status",
        type: "status",
        tooltip: "Trạng thái thanh toán trong hệ thống",
      },
      {
        key: "createdAt",
        header: "Created At",
        path: "createdAt",
        tooltip: "Ngày tạo thanh toán",
      },
    ],
    []
  );

  /*** SELECTION ***/
  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === payments.length ? [] : payments.map((p) => p.id)
    );
  }, [payments]);

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

    const toDelete = payments.filter((p) => pendingDeleteIds.includes(p.id));

    setRecentlyDeleted(toDelete);

    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyPayments(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, payments, confirmDeleteModal, dispatch, undoTimer]);

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

  /*** IMPORT ***/
  const onImportExcel = useCallback(
    (e) => {
      handleImportExcel(e, (imported) => {
        const formatted = imported.map((r) => ({
          userId: r.UserId || "",
          subtotal: Number(r.Subtotal || 0),
          total: Number(r.Total || 0),
          status: r.Status || "pending",
        }));

        dispatch(createPayment(formatted));
      });
    },
    [dispatch]
  );

  /*** EXPORT ***/
  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportPayments({
          scope,
          selectedIds: selected,
          filters: {
            status: filterStatus === "All" ? "" : filterStatus,
          },
          search,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          exportPreviewModal.open();
        }
      });
    },
    [dispatch, selected, filterStatus, search, exportPreviewModal]
  );

  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportPayments({
        scope,
        selectedIds: selected,
        filters: {
          status: filterStatus === "All" ? "" : filterStatus,
        },
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
  }, [
    dispatch,
    exportType,
    selected,
    filterStatus,
    search,
    exportPreviewModal,
  ]);

  /*** INLINE UPDATE ***/
  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      dispatch(updatePayment({ id: updatedItem.id, ...updatedItem }));

      setRecentlyUpdatedIds((prev) => [
        ...prev.filter((id) => id !== updatedItem.id),
        updatedItem.id,
      ]);

      setTimeout(() => {
        setRecentlyUpdatedIds((prev) =>
          prev.filter((id) => id !== updatedItem.id)
        );
      }, 3000);
    },
    [dispatch]
  );

  /*** AUDIT LOG ***/
  const handleShowAllPaymentHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "payment" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  /*** MISC ***/
  const isEmpty = useMemo(
    () => !adminLoading && payments.length === 0,
    [adminLoading, payments.length]
  );

  const previewColumns = useMemo(() => {
    if (!exportPreview?.columns) return [];

    return exportPreview.columns.map((key) => ({
      key,
      header: paymentExportColumnMeta[key]?.label || key,
      path: key,
    }));
  }, [exportPreview?.columns]);

  return {
    payments,

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
    filterStatus,
    setFilterStatus,

    selected,
    handleSelect,
    handleSelectAll,

    paymentFormModal,
    confirmDeleteModal,
    exportPreviewModal,

    handleDelete,
    handleDeleteSelected,
    confirmDelete,

    recentlyDeleted,
    handleUndo,

    handleInlineUpdate,
    recentlyUpdatedIds,

    onImportExcel,
    handleExportWithPreview,
    handleConfirmExport,

    exportPreview,
    previewLoading,

    logData,
    isLogModalOpen,
    logLoading,
    handleShowAllPaymentHistory,
    handleCloseLogModal,

    columns,
    previewColumns,
  };
};

export default usePayments;
