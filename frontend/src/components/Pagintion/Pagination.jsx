import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ page, totalPages, onNext, onPrev, onPageChange }) => {
  if (totalPages <= 1) return null;

  const generatePages = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePages();

  const baseBtn =
    "flex items-center justify-center h-9 min-w-9 px-3 rounded-full text-sm transition-all duration-200";

  return (
    <div className="flex items-center justify-between mt-8">
      <p className="text-sm text-primary opacity-70">
        Page <span className="font-semibold text-primary">{page}</span> /{" "}
        <span className="font-semibold text-primary">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1 bg-card rounded-full p-1 border border-border">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className={`${baseBtn} text-primary hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <FiChevronLeft size={18} />
        </button>

        {pages.map((p, index) =>
          p === "..." ? (
            <span key={index} className="px-2 text-primary opacity-40 text-sm">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(p)}
              className={`${baseBtn} ${
                p === page
                  ? "bg-primary  shadow-sm scale-105"
                  : "text-primary hover:bg-muted hover:scale-105"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={onNext}
          disabled={page === totalPages}
          className={`${baseBtn} text-primary hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <FiChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
