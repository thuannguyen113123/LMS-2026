import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useEffect, useCallback, useMemo } from "react";

import {
  selectMyQuizzes,
  selectMyQuizzesLoading,
} from "../../../features/quizzes/quizzesSlice";
import { fetchMyQuizzes } from "../../../features/quizzes/quizzesThunks";
import useDebounce from "../../useDebounce";

const useMyQuizzes = () => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  const search = params.get("search") || "";
  const status = params.get("status") || "All";
  const limit = Number(params.get("limit")) || 8;

  const debouncedSearch = useDebounce(search, 400);

  const quizzes = useSelector(selectMyQuizzes);
  const loading = useSelector(selectMyQuizzesLoading);
  const pagination = useSelector((s) => s.quizzes.paginationMy);

  const { nextCursor, hasNext } = pagination;

  useEffect(() => {
    dispatch(
      fetchMyQuizzes({
        search: debouncedSearch,
        filters: status !== "All" ? { status } : {},
        limit,
        reset: true,
      })
    );
  }, [dispatch, debouncedSearch, status, limit]);

  const setSearch = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      value ? next.set("search", value) : next.delete("search");
      next.delete("cursor");
      return next;
    });
  };

  const setStatus = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);

      if (value !== "All") next.set("status", value);
      else next.delete("status");

      next.delete("cursor");
      return next;
    });
  };

  const loadMore = useCallback(() => {
    if (!hasNext || loading) return;

    dispatch(
      fetchMyQuizzes({
        cursor: nextCursor,
        search: debouncedSearch,
        filters: status !== "All" ? { status } : {},
        limit,
        isLoadMore: true,
      })
    );
  }, [dispatch, nextCursor, hasNext, loading, debouncedSearch, status, limit]);

  const isEmpty = useMemo(
    () => !loading && quizzes.length === 0,
    [loading, quizzes.length]
  );

  return {
    quizzes,
    loading,
    isEmpty,
    hasNext,

    search,
    status,

    setSearch,
    setStatus,
    loadMore,
  };
};

export default useMyQuizzes;
