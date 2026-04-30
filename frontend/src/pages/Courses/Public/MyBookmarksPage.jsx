import React from "react";
import { Search, X, Bookmark, RotateCcw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { selectPublicCategories } from "../../../features/category/categoriesSlice";

import ModernHeroSection from "../../../components/layout/ModernHeroSection";
import CardCourse from "../../../components/Card/CardCourse";

import useBookmarks from "./../../../hooks/Bookmark/useBookmarks";
import {
  fetchBookmarks,
  toggleBookmark,
} from "./../../../features/student/studentsThunks";

const MyBookmarksPage = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectPublicCategories);

  const {
    bookmarks,
    loading,
    handleLoadMore,
    hasNext,
    search,
    setSearch,
    filters,
    setFilters,
  } = useBookmarks();

  const handleToggleBookmark = async (courseId) => {
    try {
      await dispatch(toggleBookmark(courseId)).unwrap();
      // Sau khi toggle, lọc lại bookmarks
      dispatch(fetchBookmarks({ cursor: null, limit: 12 }));
    } catch (err) {
      console.error(err);
    }
  };

  const activeFilters = [
    filters.price !== "all" && `Giá: ${filters.price}`,
    filters.rating && `Rating ≥ ${filters.rating}`,
    search && `Tìm: "${search}"`,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-app">
      {/* HERO */}
      <ModernHeroSection
        title="Thư viện khóa học"
        subtitle="Các khóa học bạn đã lưu để học sau."
        categories={categories}
        basePath="/categories"
      />

      {/* CONTENT */}
      <div className="max-w-[1680px] mx-auto px-6 py-12">
        {/* ================= TOOLBAR ================= */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-10 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            {/* SEARCH */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-3.5 w-4 h-4 opacity-50" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm trong thư viện của bạn..."
                className="
                  w-full pl-9 pr-3 py-2.5
                  bg-muted border border-border
                  rounded-xl text-sm
                  focus:ring-2 focus:ring-primary outline-none
                "
              />
            </div>

            {/* FILTER BUTTONS */}
            <div className="flex flex-wrap gap-2">
              {["all", "free", "paid"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters((prev) => ({ ...prev, price: p }))}
                  className={`
                    px-4 py-2 text-sm rounded-full border transition
                    ${
                      filters.price === p
                        ? "bg-primary text-white border-primary"
                        : "bg-muted border-border hover:bg-primary-soft"
                    }
                  `}
                >
                  {p === "all"
                    ? "Tất cả"
                    : p === "free"
                    ? "Miễn phí"
                    : "Có phí"}
                </button>
              ))}

              {/* RESET */}
              <button
                onClick={() => {
                  setFilters({ price: "all", rating: null });
                  setSearch("");
                }}
                className="px-4 py-2 text-sm rounded-full border border-border hover:bg-primary-soft flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          </div>

          {/* ACTIVE FILTER TAGS */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {activeFilters.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-full bg-primary-soft border border-border"
                >
                  {item}
                  <X
                    size={12}
                    className="cursor-pointer opacity-60 hover:opacity-100"
                    onClick={() => {
                      if (item.includes("Giá"))
                        setFilters((prev) => ({ ...prev, price: "all" }));
                      if (item.includes("Rating"))
                        setFilters((prev) => ({ ...prev, rating: null }));
                      if (item.includes("Tìm")) setSearch("");
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COUNT */}
        <div className="text-sm opacity-70 mb-6">
          {bookmarks.length} khóa học đã lưu
        </div>

        {/* ================= LOADING ================= */}
        {loading && bookmarks.length === 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-muted animate-pulse border border-border"
                />
              ))}
          </div>
        )}

        {/* ================= EMPTY ================= */}
        {!loading && bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="p-6 rounded-full bg-primary-soft mb-4">
              <Bookmark size={32} className="opacity-70" />
            </div>

            <h3 className="text-lg font-semibold mb-2">
              Bạn chưa bookmark khóa học nào
            </h3>

            <p className="text-sm opacity-60 max-w-md">
              Khi bạn lưu khóa học, chúng sẽ xuất hiện tại đây để bạn tiếp tục
              học bất cứ lúc nào.
            </p>
          </div>
        )}

        {/* ================= GRID ================= */}
        {bookmarks.length > 0 && (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {bookmarks.map((b) => (
                <CardCourse
                  key={b.course?.id ?? b.id}
                  course={b.course}
                  isBookmarked={true}
                  onToggle={() => handleToggleBookmark(b.course.id)}
                />
              ))}
            </div>

            {/* LOAD MORE */}
            {hasNext && (
              <div className="flex justify-center mt-14">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="
                    px-8 py-3 rounded-xl
                    bg-primary text-sm font-medium
                    hover:opacity-90 transition
                    disabled:opacity-50
                  "
                >
                  {loading ? "Đang tải..." : "Tải thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBookmarksPage;
