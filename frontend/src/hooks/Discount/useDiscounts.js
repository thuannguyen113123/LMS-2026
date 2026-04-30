import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { handleImportExcel } from "../../components/utils/exportImportUtils";
import {
  fetchDiscounts,
  createDiscount,
  createManyDiscounts,
  updateDiscount,
  deleteManyDiscounts,
  previewExportDiscounts,
  exportDiscounts,
} from "../../features/discounts/discountThunks";

import {
  clearRecentlyUpdated,
  selectAdminDiscounts,
  selectAdminDiscountsLoading,
  selectDiscountLoading,
  setRecentlyUpdated,
} from "../../features/discounts/discountSlice";

import { normalizeDiscountFromExcel } from "../../utils/normalizeDiscountFromExcel";
import { downloadFile } from "../../helper/downloadFile";
import useModal from "../useModal";
import useDebounce from "../useDebounce";

const typeFilterOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Phần trăm (%)", value: "percentage" },
  { label: "Giá cố định (VND)", value: "fixed" },
];

const statusFilterOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Đang hoạt động", value: "true" },
  { label: "Ngưng hoạt động", value: "false" },
];
const exportColumnMeta = {
  code: { label: "Code" },
  type: { label: "Type" },
  value: { label: "Value" },
  minOrderValue: { label: "Min Order" },
  maxDiscountAmount: { label: "Max Discount" },
  applicableTo: { label: "Applicable To" },
  usageLimit: { label: "Usage Limit" },
  usedCount: { label: "Used Count" },
  isActive: { label: "Status" },
  startDate: { label: "Start Date" },
  endDate: { label: "End Date" },
  createdBy: { label: "Created By" },
};
const useDiscounts = () => {
  const dispatch = useDispatch();

  /** UI STATE */

  const [selected, setSelected] = useState([]);

  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);

  const [editDiscount, setEditDiscount] = useState(null);
  const [exportType, setExportType] = useState(null);

  /** MODALS */
  const discountFormModal = useModal("discountForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  /** REDUX STATE */
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.discounts
  );
  const adminLoading = useSelector(selectAdminDiscountsLoading);
  const discountLoading = useSelector(selectDiscountLoading);

  const discounts = useSelector(selectAdminDiscounts);

  const recentlyUpdatedIds = useSelector(
    (state) => state.discounts.recentlyUpdatedIds
  );
  const { totalPages } = paginationAdmin;

  /** URL PARAMS */
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

  /** FILTERS */
  const filters = useMemo(() => {
    return {
      type: params.get("type") || "all",
      isActive: params.get("isActive") || "all",
    };
  }, [params]);

  const setFilters = useCallback(
    (nextFilters) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(nextFilters).forEach(([key, value]) => {
          if (!value || value === "all") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });

        next.set("page", 1); // reset page khi filter

        return next;
      });
    },
    [setParams]
  );

  /** FETCH DATA */
  useEffect(() => {
    const cleanFilters = {};

    if (filters.type !== "all") {
      cleanFilters.type = filters.type;
    }

    if (filters.isActive !== "all") {
      cleanFilters.isActive = filters.isActive;
    }

    dispatch(
      fetchDiscounts({
        page,
        limit,
        filters: cleanFilters,
        search: debouncedSearch,
      })
    );
  }, [dispatch, page, limit, filters, debouncedSearch]);

  /** PAGINATION */
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

  /** TABLE COLUMNS */
  const columns = useMemo(
    () => [
      {
        key: "code",
        header: "Discount Code",
        path: "code",
        tooltip: "Mã giảm giá",
      },
      {
        key: "type",
        header: "Type",
        path: "type",
        tooltip: "Loại giảm giá (percentage hoặc fixed)",
      },
      {
        key: "value",
        header: "Value",
        path: "value",
        tooltip: "Giá trị giảm",
      },
      {
        key: "usageLimit",
        header: "Usage Limit",
        path: "usage.usageLimit",
        tooltip: "Số lần sử dụng tối đa",
      },
      {
        key: "usedCount",
        header: "Used",
        path: "usage.usedCount",
        tooltip: "Số lần đã sử dụng",
      },
      {
        key: "remaining",
        header: "Remaining",
        path: "usage.remaining",
        tooltip: "Số lượt còn lại",
      },

      {
        key: "endDate",
        header: "End Date",
        path: "validity.endDate",
        tooltip: "Ngày hết hạn",
      },
      {
        key: "isActive",
        header: "Status",
        path: "validity.isActive",
        tooltip: "Trạng thái kích hoạt",
        type: "boolean",
      },

      {
        key: "createdAt",
        header: "Created At",
        path: "createdAt",
        tooltip: "Thời gian tạo",
      },
    ],
    []
  );

  /** SELECTION */
  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === discounts.length ? [] : discounts.map((d) => d.id)
    );
  }, [discounts]);

  /** DELETE */
  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open({ ids });
    },
    [confirmDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDeleteIds.length) return;

    const toDelete = discounts.filter((d) => pendingDeleteIds.includes(d.id));

    setRecentlyDeleted(toDelete);

    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyDiscounts(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    confirmDeleteModal.close();
    setPendingDeleteIds([]);
  }, [dispatch, pendingDeleteIds, discounts, undoTimer, confirmDeleteModal]);

  const handleDelete = useCallback(
    (id) => openConfirmDelete([id]),
    [openConfirmDelete]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selected.length) openConfirmDelete(selected);
  }, [selected, openConfirmDelete]);

  const handleUndo = useCallback(() => {
    if (undoTimer) clearTimeout(undoTimer);

    setUndoTimer(null);
    setRecentlyDeleted([]);
  }, [undoTimer]);

  /** FORM SUBMIT */
  const handleSubmit = useCallback(
    (form) => {
      if (editDiscount) {
        dispatch(updateDiscount({ id: editDiscount.id, ...form }));
      } else {
        dispatch(createDiscount(form));
      }

      discountFormModal.close();
    },
    [dispatch, editDiscount, discountFormModal]
  );

  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      dispatch(updateDiscount({ id: updatedItem.id, ...updatedItem }));

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

  /** IMPORT EXCEL */
  const onImportExcel = useCallback(
    (e) => {
      handleImportExcel(e, (rows) => {
        const formatted = rows.map(normalizeDiscountFromExcel).filter(Boolean);

        if (!formatted.length) return;

        dispatch(createManyDiscounts(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(
              fetchDiscounts({
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

  /** EXPORT */
  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportDiscounts({
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
      exportDiscounts({
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

  /** TABLE CONFIG */
  const columnsConfig = useMemo(
    () => [
      { key: "code", label: "Code", editableType: "text" },
      {
        key: "type",
        label: "Type",
        editableType: "select",
        options: typeFilterOptions,
      },
      { key: "value", label: "Value", editableType: "number" },
      {
        key: "isActive",
        label: "Status",
        editableType: "select",
        options: statusFilterOptions,
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

  const isEmpty = useMemo(
    () => !adminLoading && discounts.length === 0,
    [adminLoading, discounts]
  );
  const isSubmitting = editDiscount
    ? discountLoading.update
    : discountLoading.create;

  return {
    discounts,

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

    editDiscount,
    setEditDiscount,

    discountFormModal,
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

    columns,
    columnsConfig,

    filters,
    setFilters,
    handlePageChange,
    pendingDeleteIds,
    recentlyUpdatedIds,

    typeFilterOptions,
    statusFilterOptions,
    previewColumns,
    isSubmitting,
  };
};

export default useDiscounts;
