import React, { useState } from "react";
import { SlidersHorizontal, X, Search, Star, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SidebarFilter = ({ categories, filters, updateFilters }) => {
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  const resetFilters = () => {
    updateFilters({
      price: "all",
      rating: null,
      sort: "default",
      search: "",
      instructor: null,
    });
  };

  return (
    <>
      <button
        onClick={() => setShowFilter(true)}
        className="md:hidden flex items-center gap-2 px-4 py-2 mb-4 bg-primary text-sm rounded-xl shadow-soft transition hover:opacity-90"
      >
        <SlidersHorizontal size={16} />
        Bộ lọc
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity md:hidden ${
          showFilter
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowFilter(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
        bg-card border border-border
        fixed md:static top-0 left-0 h-full md:h-auto
        w-3/4 sm:w-2/3 md:w-full
        p-6 z-40 overflow-y-auto
        transition-transform duration-300
        ${showFilter ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <SlidersHorizontal size={18} />
            Bộ lọc
          </h2>
          <button
            onClick={() => setShowFilter(false)}
            className="p-2 rounded-lg hover:bg-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-8">
          {/* SEARCH */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tìm kiếm</label>
            <div className="relative bg-card border border-gray-200 p-2 rounded-2xl">
              <Search className="absolute right-2 top-2.5 w-4 h-4 opacity-50" />
              <input
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="outline-none focus:outline-none focus:ring-0 border-none"
              />
            </div>
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-sm font-medium mb-2 block">Danh mục</label>
            <select
              value={filters.category || "all"}
              onChange={(e) => {
                const value = e.target.value;

                if (value === "all") {
                  navigate("/categories");
                } else {
                  navigate(`/categories/${value}`);
                }
              }}
              className="outline-none focus:outline-none focus:ring-0 border border-gray-200 p-2 rounded-2xl"
            >
              <option value="all">Tất cả</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* PRICE */}
          <div>
            <label className="text-sm font-medium mb-3 block">Mức giá</label>
            <div className="flex flex-col gap-2 text-sm">
              {["all", "free", "paid"].map((p) => {
                const isActive = filters.price === p;
                return (
                  <button
                    key={p}
                    onClick={() => updateFilters({ price: p })}
                    className={`text-left px-3 py-2 rounded-xl border transition ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "bg-muted border-border hover:bg-primary-soft"
                    }`}
                  >
                    {p === "all"
                      ? "Tất cả"
                      : p === "free"
                      ? "Miễn phí"
                      : "Có phí"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RATING */}
          <div>
            <label className="text-sm font-medium mb-3 block">Đánh giá</label>
            <div className="flex flex-col gap-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const isSelected = filters.rating === stars;

                return (
                  <div
                    key={stars}
                    onClick={() =>
                      updateFilters({
                        rating: filters.rating === stars ? null : stars,
                      })
                    }
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer border transition ${
                      isSelected
                        ? "bg-primary-soft border-primary"
                        : "bg-muted border-border hover:bg-primary-soft"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {Array(stars)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={`${
                              isSelected ? "fill-primary" : "fill-primary/60"
                            }`}
                          />
                        ))}
                      <span className="text-xs ml-2 opacity-70">trở lên</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SORT */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sắp xếp</label>
            <select
              value={filters.sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="w-full bg-muted border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <option value="default">Mặc định</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="rating_desc">Rating cao nhất</option>
            </select>
          </div>

          {/* RESET */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm hover:bg-primary-soft transition"
          >
            <RotateCcw size={14} />
            Reset bộ lọc
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarFilter;
