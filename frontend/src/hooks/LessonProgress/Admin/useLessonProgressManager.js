import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  fetchLessonProgressDetail,
  fetchLessonProgressList,
  resetLessonProgressById,
} from "../../../features/lessonProgress/lessonProgressThunks";
import {
  closeProgressModal,
  openProgressModal,
  selectLessonProgressList,
  selectLessonProgressListLoading,
} from "../../../features/lessonProgress/lessonProgressSlice";

const statusOptions = [
  { label: "All status", value: "all" },
  { label: "Not started", value: "not_started" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

const sortOptions = [
  { label: "Latest", value: "latest" },
  { label: "Oldest", value: "oldest" },
  { label: "Progress ↓", value: "progress_desc" },
  { label: "Progress ↑", value: "progress_asc" },
];

const useLessonProgressManager = () => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  const [confirmResetModal, setConfirmResetModal] = useState(false);
  const [pendingResetId, setPendingResetId] = useState(null);

  const { errorCode, pagination, detail, detailLoading, isDetailModalOpen } =
    useSelector((state) => state.lessonProgress);
  const adminLoading = useSelector(selectLessonProgressListLoading);

  const progresses = useSelector(selectLessonProgressList);

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  const filters = useMemo(() => {
    return {
      course: params.get("course") || "all",
      lesson: params.get("lesson") || "all",
      status: params.get("status") || "all",
      sort: params.get("sort") || "latest",
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

  useEffect(() => {
    dispatch(
      fetchLessonProgressList({
        page,
        limit,
        filters,
        sort: filters.sort,
      })
    );
  }, [dispatch, page, limit, filters]);

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
    if (!pagination.hasNext) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page + 1);
      return next;
    });
  }, [pagination, page, setParams]);

  const handlePrev = useCallback(() => {
    if (!pagination.hasPrev) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", page - 1);
      return next;
    });
  }, [pagination, page, setParams]);

  const handleOpenDetail = useCallback(
    (id) => {
      dispatch(openProgressModal());
      dispatch(fetchLessonProgressDetail(id));
    },
    [dispatch]
  );

  const handleCloseDetail = useCallback(() => {
    dispatch(closeProgressModal());
  }, [dispatch]);

  const columns = useMemo(
    () => [
      {
        key: "courseTitle",
        header: "Course",
        path: "courseTitle",
      },
      {
        key: "studentName",
        header: "Student",
        path: "studentName",
      },
      {
        key: "lessonTitle",
        header: "Lesson",
        path: "lessonTitle",
      },
      {
        key: "lessonType",
        header: "Type",
        path: "lessonType",
        render: (item) => {
          const map = {
            video: "Video",
            reading: "Reading",
            assignment: "Assignment",
          };
          return map[item.lessonType] || item.lessonType;
        },
      },
      {
        key: "status",
        header: "Status",
        path: "status",
        type: "status",
      },
      {
        key: "percent",
        header: "Progress",
        path: "percent",
        render: (item) => `${item.percent ?? 0}%`,
      },
      {
        key: "updatedAt",
        header: "Updated",
        path: "updatedAt",
        render: (item) => new Date(item.updatedAt).toLocaleDateString("vi-VN"),
      },
    ],
    []
  );

  const isEmpty = useMemo(
    () => !adminLoading && progresses.length === 0,
    [adminLoading, progresses]
  );

  const handleResetProgress = useCallback((id) => {
    setPendingResetId(id);
    setConfirmResetModal(true);
  }, []);

  const confirmReset = useCallback(() => {
    if (!pendingResetId) return;

    dispatch(resetLessonProgressById(pendingResetId));

    setPendingResetId(null);
  }, [dispatch, pendingResetId]);

  const closeResetModal = useCallback(() => {
    setConfirmResetModal(false);
    setPendingResetId(null);
  }, []);

  return {
    progresses,

    loading: adminLoading,
    errorCode,
    isEmpty,

    page,
    totalPages: pagination.totalPages,

    hasNext: pagination.hasNext,
    hasPrev: pagination.hasPrev,

    handleNext,
    handlePrev,
    handlePageChange,

    filters,
    setFilters,

    statusOptions,
    sortOptions,
    columns,

    detail,
    detailLoading,
    isDetailModalOpen,
    handleOpenDetail,
    handleCloseDetail,
    handleResetProgress,
    confirmResetModal,
    pendingResetId,
    confirmReset,
    closeResetModal,
  };
};

export default useLessonProgressManager;
