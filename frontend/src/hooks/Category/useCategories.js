import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteManyCategories,
  createManyCategories,
  previewExportCategories,
  exportCategories,
} from "../../features/category/categoriesThunks";
import {
  clearRecentlyUpdated,
  selectAdminCategories,
  selectAdminCategoryLoading,
  selectCategoryDeleting,
  selectCategoryLoading,
  setRecentlyUpdated,
} from "../../features/category/categoriesSlice";
import { handleImportExcel } from "../../components/utils/exportImportUtils";
import { normalizeCategoryFromExcel } from "../../utils/normalizeCategoryFromExcel";
import {
  openAuditModal,
  closeAuditModal,
} from "../../features/auditLog/auditLogSlice";
import { fetchAuditLogs } from "../../features/auditLog/auditLogThunks";
import { downloadFile } from "../../helper/downloadFile";
import useModal from "../useModal";
import useDebounce from "../useDebounce";
//Hàm import
import { useResponsive } from "./../useResponsive";

const useCategories = () => {
  const dispatch = useDispatch();

  //State
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [editCategory, setEditCategory] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [undoTimer, setUndoTimer] = useState(null);
  const [exportType, setExportType] = useState(null);

  //Modal
  const categoryFormModal = useModal("categoryForm");
  const confirmDeleteModal = useModal("confirmDelete");
  const exportPreviewModal = useModal("exportPreview");

  const debouncedSearch = useDebounce(search, 500);
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);
  const status = params.get("status") || "All";
  const { error, exportPreview, previewLoading, paginationAdmin } = useSelector(
    (state) => state.categories
  );
  const adminLoading = useSelector(selectAdminCategoryLoading);
  const categoryLoading = useSelector(selectCategoryLoading);

  const deleteLoading = useSelector(selectCategoryDeleting);

  const categories = useSelector(selectAdminCategories);
  const recentlyUpdatedIds = useSelector(
    (state) => state.categories.recentlyUpdatedIds
  );
  const { totalPages } = paginationAdmin;
  const { isMobile, isTablet } = useResponsive();
  //Filter
  const setFilterCategory = useCallback(
    (value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);

        if (value === "All") {
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

  //Audit Log
  const {
    list: logData,
    isOpen: isLogModalOpen,
    loading: logLoading,
  } = useSelector((state) => state.auditLogs);

  //lấy dữ liệu
  useEffect(() => {
    dispatch(
      fetchCategories({
        page,
        limit,
        search: debouncedSearch,
        filters: {
          status: status === "All" ? undefined : status,
        },
      })
    );
  }, [dispatch, page, limit, debouncedSearch, status]);

  /** SYNC URL */
  useEffect(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);

      if (prev.get("search") !== debouncedSearch) {
        next.set("page", 1);
      }

      next.set("limit", limit);
      next.set("search", debouncedSearch);

      return next;
    });
  }, [debouncedSearch, limit, setParams]);

  //Xữ lý chuyển trang
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
  //trả về trang sau trong phân trang
  const handleNext = useCallback(() => {
    if (page >= totalPages) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page + 1);
      return next;
    });
  }, [page, totalPages, setParams]);
  //trả về trang trước trong phân trang
  const handlePrev = useCallback(() => {
    if (page <= 1) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page - 1);
      return next;
    });
  }, [page, setParams]);

  /** SELECT */
  //xử lý select
  const handleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }, []);
  //Chọn
  const handleSelectAll = useCallback(() => {
    setSelected((prev) =>
      prev.length === categories.length ? [] : categories.map((c) => c.id)
    );
  }, [categories]);

  //Mở modal xóa
  const openConfirmDelete = useCallback(
    (ids) => {
      setPendingDeleteIds(ids);
      confirmDeleteModal.open({ ids });
    },
    [confirmDeleteModal]
  );
  //Xác nhận xóa
  const confirmDelete = useCallback(() => {
    if (pendingDeleteIds.length === 0) {
      confirmDeleteModal.close();
      return;
    }

    const toDelete = categories.filter((c) => pendingDeleteIds.includes(c.id));

    setRecentlyDeleted(toDelete);
    setSelected([]);

    if (undoTimer) clearTimeout(undoTimer);

    const timer = setTimeout(() => {
      dispatch(deleteManyCategories(pendingDeleteIds));
      setRecentlyDeleted([]);
    }, 5000);

    setUndoTimer(timer);

    setPendingDeleteIds([]);
    confirmDeleteModal.close();
  }, [pendingDeleteIds, categories, dispatch, undoTimer, confirmDeleteModal]);
  //Delete
  const handleDelete = useCallback(
    (id) => openConfirmDelete([id]),
    [openConfirmDelete]
  );
  //hàm xóa khi chọn
  const handleDeleteSelected = useCallback(() => {
    if (selected.length > 0) openConfirmDelete(selected);
  }, [selected, openConfirmDelete]);
  //Ham undo
  const handleUndo = useCallback(() => {
    if (undoTimer) clearTimeout(undoTimer);
    setUndoTimer(null);
    setRecentlyDeleted([]);
  }, [undoTimer]);

  //Sudmit form
  const handleSubmit = useCallback(
    (form) => {
      if (editCategory) {
        dispatch(updateCategory({ id: editCategory.id, ...form }));
      } else {
        dispatch(createCategory(form));
      }

      categoryFormModal.close();
    },
    [dispatch, editCategory, categoryFormModal]
  );

  //Cập nhật dòng
  const handleInlineUpdate = useCallback(
    (updatedItem) => {
      const payload = {
        name: updatedItem.name?.trim(),
        description: updatedItem.description,
        status: updatedItem.status,
      };

      dispatch(
        updateCategory({
          id: updatedItem.id,
          ...payload,
        })
      );

      dispatch(setRecentlyUpdated(updatedItem.id));
    },
    [dispatch]
  );

  const onImportExcel = useCallback(
    (e) => {
      handleImportExcel(e, (rows) => {
        const formatted = rows.map(normalizeCategoryFromExcel).filter(Boolean);

        if (!formatted.length) return;

        dispatch(createManyCategories(formatted)).then((res) => {
          if (res.meta.requestStatus === "fulfilled") {
            dispatch(fetchCategories({ page: 1, limit }));
          }
        });
      });
    },
    [dispatch, limit]
  );

  //Preview báo cáo trước khi xuất
  const handleExportWithPreview = useCallback(
    (type) => {
      const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

      setExportType(type);

      dispatch(
        previewExportCategories({
          scope,
          selectedIds: selected,
          search,
        })
      ).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          exportPreviewModal.open();
        }
      });
    },
    [dispatch, selected, search, exportPreviewModal]
  );
  //Xác thực xuất báo cáo
  const handleConfirmExport = useCallback(() => {
    if (!exportType) return;

    const scope = selected.length === 0 ? "CURRENT_PAGE" : "SELECTED";

    dispatch(
      exportCategories({
        scope,
        selectedIds: selected,
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
  }, [dispatch, exportType, selected, search, exportPreviewModal]);
  //Modal lịch sử
  const handleShowAllCategoryHistory = useCallback(() => {
    dispatch(fetchAuditLogs({ entityType: "categories" }));
    dispatch(openAuditModal());
  }, [dispatch]);

  const handleCloseLogModal = useCallback(() => {
    dispatch(closeAuditModal());
  }, [dispatch]);

  useEffect(() => {
    if (!recentlyUpdatedIds.length) return;

    const timers = recentlyUpdatedIds.map((id) =>
      setTimeout(() => {
        dispatch(clearRecentlyUpdated(id));
      }, 3000)
    );

    return () => timers.forEach(clearTimeout);
  }, [recentlyUpdatedIds, dispatch]);

  const isEmpty = useMemo(
    () => !adminLoading && categories.length === 0,
    [adminLoading, categories.length]
  );
  const categoryOptions = [
    { label: "All", value: "All" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];
  //Cột render ra table
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        path: "name",
        tooltip: "Tên danh mục.",
      },
      {
        key: "description",
        header: "Description",
        path: "description",
        tooltip: "Mô tả ngắn về danh mục.",
      },
      {
        key: "slug",
        header: "Slug",
        path: "slug",
        tooltip: "Slug dùng trong URL của danh mục.",
      },
      {
        key: "status",
        header: "Status",
        path: "status",
        tooltip: "Trạng thái danh mục",
        type: "status",
      },
      {
        key: "createdAt",
        header: "Created At",
        path: "createdAt",
        tooltip: "Ngày danh mục được tạo.",
      },
    ],
    []
  );
  const tabletColumns = ["name", "status"];
  const visibleColumns = isTablet
    ? columns.filter((col) => tabletColumns.includes(col.key))
    : columns;
  const columnsConfig = [
    {
      key: "name",
      editableType: "text",
    },
    {
      key: "description",
      editableType: "text",
    },
    {
      key: "status",
      editableType: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];
  const isSubmitting = editCategory
    ? categoryLoading.update
    : categoryLoading.create;

  return {
    categories,

    loading: adminLoading,
    error,
    isEmpty,

    page,
    totalPages,

    hasNext: page < totalPages,
    hasPrev: page > 1,

    handleNext,
    handlePrev,
    handlePageChange,

    search,
    setSearch,

    selected,
    handleSelect,
    handleSelectAll,

    editCategory,
    setEditCategory,

    categoryFormModal,
    confirmDeleteModal,
    exportPreviewModal,

    handleSubmit,
    handleDelete,
    handleDeleteSelected,
    confirmDelete,

    recentlyDeleted,
    handleUndo,

    onImportExcel,

    handleExportWithPreview,
    handleConfirmExport,

    exportPreview,
    previewLoading,

    logData,
    isLogModalOpen,
    logLoading,
    handleShowAllCategoryHistory,
    handleCloseLogModal,
    filterCategory: status,
    setFilterCategory,
    columns,
    categoryOptions,
    pendingDeleteIds,
    recentlyUpdatedIds,
    columnsConfig,
    handleInlineUpdate,
    isSubmitting,
    visibleColumns,
    isMobile,
    deleteLoading,
  };
};

export default useCategories;
