import { useDispatch, useSelector } from "react-redux";
import { useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import useDebounce from "../useDebounce";
import useModal from "../useModal";
import {
  openAttemptDetailModal,
  selectAdminStudentQuizAttempts,
  selectAttemptListLoading,
} from "../../features/studentQuizAttempt/studentQuizAttemptSlice";
import { fetchStudentQuizAttempts } from "../../features/studentQuizAttempt/studentQuizAttemptThunks";

const useStudentQuizAttempts = (studentId = "", quizId = "") => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);

  const search = params.get("search") || "";
  const status = params.get("status") || "";

  const debouncedSearch = useDebounce(search, 500);

  const attempts = useSelector(selectAdminStudentQuizAttempts);

  const { errorCode, pagination } = useSelector(
    (state) => state.studentQuizAttempt
  );
  const adminLoading = useSelector(selectAttemptListLoading);

  const { totalPages } = pagination;

  useEffect(() => {
    dispatch(
      fetchStudentQuizAttempts({
        page,
        limit,
        search: debouncedSearch,
        filters: {
          status,
          student: studentId,
          quiz: quizId,
        },
      })
    );
  }, [dispatch, page, limit, debouncedSearch, status, studentId, quizId]);

  const updateParams = useCallback(
    (next) => {
      setParams((prev) => {
        const p = new URLSearchParams(prev);

        Object.entries(next).forEach(([k, v]) => {
          if (!v) p.delete(k);
          else p.set(k, v);
        });

        p.set("page", 1);

        return p;
      });
    },
    [setParams]
  );

  /** SEARCH */

  const setSearch = useCallback(
    (value) => updateParams({ search: value }),
    [updateParams]
  );

  /** STATUS FILTER */

  const setStatus = useCallback(
    (value) => updateParams({ status: value }),
    [updateParams]
  );

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

  const detailModal = useSelector((s) => s.studentQuizAttempt.detailModal);
  const confirmDeleteModal = useModal("confirmDelete");

  const columns = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        path: "student.fullname",
      },
      {
        key: "quiz",
        header: "Quiz",
        path: "quiz.title",
      },
      {
        key: "score",
        header: "Score",
        path: "score",
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
        render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN"),
      },
    ],
    []
  );

  const isEmpty = useMemo(
    () => !adminLoading && attempts.length === 0,
    [adminLoading, attempts.length]
  );

  const openAttemptDetail = useCallback(
    (attempt) => {
      dispatch(openAttemptDetailModal(attempt.id));
    },
    [dispatch]
  );

  return {
    attempts,

    loading: adminLoading,
    error: errorCode,
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
    status,
    setStatus,

    columns,

    openAttemptDetail,
    detailModal,
    confirmDeleteModal,
  };
};

export default useStudentQuizAttempts;
