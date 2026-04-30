import { useState, useMemo, useCallback } from "react";

const getValue = (obj, path) =>
  path.split(".").reduce((o, key) => o?.[key], obj);

export default function useSortableData(items, columns) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    order: "desc",
  });

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          order: prev.order === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        order: "desc", // default lần đầu
      };
    });
  }, []);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;

    const column = columns.find((c) => c.key === sortConfig.key);
    if (!column) return items;

    const path = column.path;

    return [...items].sort((a, b) => {
      let aVal = getValue(a, path);
      let bVal = getValue(b, path);

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string") {
        return sortConfig.order === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (path.includes("createdAt") || path.includes("date")) {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();

        return sortConfig.order === "asc" ? aDate - bDate : bDate - aDate;
      }

      return sortConfig.order === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [items, sortConfig, columns]);

  return {
    sortedItems,
    sortKey: sortConfig.key,
    sortOrder: sortConfig.order,
    handleSort,
  };
}
