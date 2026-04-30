import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useEffect, useCallback, useMemo } from "react";

import { fetchMyCourses } from "../../../features/courses/coursesThunks";
import {
  selectMyCourses,
  selectMyCoursesLoading,
  selectMyCoursesPagination,
} from "../../../features/courses/coursesSlice";

const useMyCourses = () => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  const search = params.get("search") || "";
  const sort = params.get("sort") || "recent";
  const type = params.get("type") || "All";
  const limit = Number(params.get("limit")) || 8;

  const courses = useSelector(selectMyCourses);
  const loading = useSelector(selectMyCoursesLoading);
  const pagination = useSelector(selectMyCoursesPagination);
  const { nextCursor, hasNext } = pagination || {};

  /** ---------------- FETCH (RESET MODE) ---------------- **/
  useEffect(() => {
    dispatch(
      fetchMyCourses({
        search,
        sort,
        type,
        limit,
        reset: true, // ⭐ VERY IMPORTANT
      })
    );
  }, [dispatch, search, sort, type, limit]);

  /** ---------------- FILTER API ---------------- **/
  const setFilter = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);

      // remove default values
      if (!value || value === "All") {
        next.delete(key);
      } else {
        next.set(key, value);
      }

      // reset pagination
      next.delete("cursor");

      return next;
    });
  };

  const setSearch = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value) next.delete("search");
      else next.set("search", value);

      next.delete("cursor");
      return next;
    });
  };

  const setLimit = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("limit", value);
      next.delete("cursor");
      return next;
    });
  };

  /** ---------------- LOAD MORE (CURSOR MODE) ---------------- **/
  const loadMore = useCallback(() => {
    if (!hasNext || loading) return;

    dispatch(
      fetchMyCourses({
        cursor: nextCursor,
        search,
        sort,
        type,
        limit,
      })
    );
  }, [dispatch, hasNext, loading, nextCursor, search, sort, type, limit]);

  /** ---------------- EMPTY STATE ---------------- **/
  const isEmpty = useMemo(
    () => !loading && courses.length === 0,
    [loading, courses.length]
  );

  return {
    courses,
    loading,
    isEmpty,
    hasNext,

    // state
    search,
    sort,
    type,
    limit,

    // actions
    setFilter,
    setSearch,
    setLimit,
    loadMore,
  };
};

export default useMyCourses;
