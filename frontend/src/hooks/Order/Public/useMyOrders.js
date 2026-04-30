import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useEffect, useCallback, useMemo } from "react";
import {
  selectStudentOrders,
  selectStudentOrdersLoading,
  selectStudentOrdersPagination,
} from "../../../features/orders/ordersSlice";
import { fetchMyOrders } from "../../../features/orders/ordersThunks";

const useMyOrders = () => {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();

  /** ---------------- URL STATE ---------------- **/
  const status = params.get("status") || "all";
  const limit = Number(params.get("limit")) || 8;

  /** ---------------- REDUX ---------------- **/
  const orders = useSelector(selectStudentOrders);
  const loading = useSelector(selectStudentOrdersLoading);
  const pagination = useSelector(selectStudentOrdersPagination);

  const { nextCursor, hasNext } = pagination || {};

  /** ---------------- INITIAL FETCH ---------------- **/
  useEffect(() => {
    dispatch(
      fetchMyOrders({
        status,
        limit,
      })
    );
  }, [dispatch, status, limit]);

  /** ---------------- FILTER ---------------- **/
  const setStatus = (value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);

      if (value && value !== "All") next.set("status", value);
      else next.delete("status");

      next.delete("cursor");
      return next;
    });
  };

  /** ---------------- LOAD MORE ---------------- **/
  const loadMore = useCallback(() => {
    if (!hasNext || loading) return;

    dispatch(
      fetchMyOrders({
        cursor: nextCursor,
        status,
        limit,
      })
    );
  }, [dispatch, hasNext, loading, nextCursor, status, limit]);

  const isEmpty = useMemo(
    () => !loading && orders.length === 0,
    [loading, orders.length]
  );

  return {
    orders,
    loading,
    isEmpty,
    hasNext,

    status,
    setStatus,
    loadMore,
  };
};

export default useMyOrders;
