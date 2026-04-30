import React, { useCallback } from "react";
import { FaSortUp, FaSortDown } from "react-icons/fa";

const TableHeader = ({
  label,
  sortKey,
  currentKey,
  order,
  onClick,
  tooltip,
}) => {
  const isActive = currentKey === sortKey;

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const tooltipId = `tooltip-${label.replace(/\s+/g, "")}`;

  return (
    <th
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-sort={
        isActive ? (order === "asc" ? "ascending" : "descending") : "none"
      }
      aria-describedby={tooltip ? tooltipId : undefined}
      className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase cursor-pointer select-none hover:bg-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded transition-colors duration-200"
    >
      <div className="flex items-center gap-1 group">
        <span>{label}</span>

        {tooltip && (
          <div
            className="tooltip-btn ml-1"
            tabIndex={0}
            aria-describedby={tooltipId}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400 cursor-help"
              fill="currentColor"
              viewBox="0 0 24 24"
              stroke="none"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="10" />
              <text
                x="12"
                y="16"
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="white"
              >
                ?
              </text>
            </svg>

            <div role="tooltip" id={tooltipId} className="tooltip-text">
              {tooltip}
            </div>
          </div>
        )}
        {isActive && (
          <span
            aria-hidden="true"
            className="text-indigo-600 transition-transform duration-200 group-hover:scale-110 "
          >
            {order === "asc" ? (
              <FaSortUp size={18} />
            ) : (
              <FaSortDown size={18} />
            )}
          </span>
        )}
      </div>
    </th>
  );
};

export default TableHeader;
