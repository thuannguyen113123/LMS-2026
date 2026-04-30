import { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import { fetchPublicCourses } from "../../../features/courses/coursesThunks";
import { selectPublicCourses } from "../../../features/courses/coursesSlice";

const usePublicCourses = (categoryFromSlug) => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  const courses = useSelector(selectPublicCourses);
  const loadingList = useSelector((s) => s.courses.loading.publicList);
  const loadingMore = useSelector((s) => s.courses.loading.publicLoadMore);
  const nextCursor = useSelector((s) => s.courses.paginationPublic.nextCursor);

  const filters = useMemo(() => {
    return {
      category: categoryFromSlug || undefined,
      instructor: params.get("instructor") || undefined,
      search: params.get("search") || "",
      price: params.get("price") || "all",
      rating: params.get("rating") ? Number(params.get("rating")) : null,
      sort: params.get("sort") || "default",
    };
  }, [params, categoryFromSlug]);

  // 🎯 update URL
  const updateFilters = (newFilters) => {
    const updated = new URLSearchParams();

    const merged = { ...filters, ...newFilters };

    Object.entries(merged).forEach(([key, value]) => {
      if (key === "category") return; // ❌ chặn luôn

      if (
        value === null ||
        value === undefined ||
        value === "all" ||
        value === ""
      ) {
        return;
      }

      updated.set(key, value);
    });

    setParams(updated);
  };

  const fetchFirst = useCallback(() => {
    dispatch(
      fetchPublicCourses({
        limit: 8,
        filters,
      })
    );
  }, [dispatch, filters]);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor) return;

    dispatch(
      fetchPublicCourses({
        cursor: nextCursor,
        limit: 12,
        filters,
        isLoadMore: true,
      })
    );
  }, [dispatch, nextCursor, filters]);

  useEffect(() => {
    fetchFirst();
  }, [fetchFirst]);

  return {
    courses,
    loadingList,
    loadingMore,
    filters,
    updateFilters,
    handleLoadMore,
    hasNext: !!nextCursor,
  };
};

export default usePublicCourses;
