import React from "react";

import SearchInput from "../../components/common/SearchInput";
import useMyOrders from "./../../hooks/Order/Public/useMyOrders";
import FilterSelect from "../../components/common/FilterSelect";
import MyOrderCard from "./../../components/Card/MyOrderCard";

const statusOptions = [
  { value: "all", label: "All orders" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const StudentOrders = () => {
  const {
    orders,
    status,
    setStatus,
    loading,
    isEmpty,
    hasNext,
    search,
    setSearch,
    loadMore,
  } = useMyOrders();

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your purchases and payments
          </p>
        </div>

        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-xl p-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
          />

          <FilterSelect
            options={statusOptions}
            value={status}
            onChange={(v) => setStatus(v)}
          />
        </div>
      </div>

      {/* EMPTY */}
      {isEmpty && (
        <div className="text-center py-20">🧾 You have no orders yet</div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => (
          <MyOrderCard key={order.id} order={order} />
        ))}
      </div>

      {/* LOAD MORE */}
      {hasNext && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentOrders;
