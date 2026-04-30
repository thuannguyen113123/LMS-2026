import React from "react";
import { useParams } from "react-router-dom";
import { Filter, X } from "lucide-react";
import { useSelector } from "react-redux";

import SidebarFilter from "../../../components/layout/SidebarFilter";
import CardCourse from "../../../components/Card/CardCourse";
import { selectPublicCategories } from "../../../features/category/categoriesSlice";
import ModernHeroSection from "../../../components/layout/ModernHeroSection";
import usePublicCourses from "./../../../hooks/Course/Public/usePublicCourses";

const CourseCategoryPage = () => {
  const { slug } = useParams();

  const {
    courses,
    loadingList,
    loadingMore,
    handleLoadMore,
    hasNext,
    filters,
    updateFilters,
  } = usePublicCourses(slug);

  const categories = useSelector(selectPublicCategories);

  const category = categories?.find((c) => c.slug === filters.category);

  const activeFilters = [
    filters.price !== "all" && { key: "price", label: `Giá: ${filters.price}` },
    filters.rating && { key: "rating", label: `Rating ≥ ${filters.rating}` },
    filters.sort !== "default" && {
      key: "sort",
      label: `Sort: ${filters.sort}`,
    },
    filters.search && { key: "search", label: `Tìm: "${filters.search}"` },
    filters.instructor && { key: "instructor", label: "Giảng viên" },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-app">
      {/* HERO */}
      <ModernHeroSection
        title={category?.name || "Tất cả khóa học"}
        subtitle="Khám phá các khóa học chất lượng cao"
        categories={categories}
        basePath="/categories"
      />

      {/* CONTENT */}
      <div className="max-w-[1680px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
        {/* SIDEBAR */}
        <div className="md:sticky md:top-24 h-fit">
          <SidebarFilter
            categories={categories}
            filters={filters}
            updateFilters={updateFilters}
          />
        </div>

        {/* MAIN */}
        <main>
          {/* TOP BAR */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="text-sm opacity-70">{courses.length} khóa học</div>

            {/* ACTIVE FILTERS */}
            {activeFilters.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-full bg-primary-soft border border-border"
              >
                {item.label}

                <X
                  size={12}
                  className="cursor-pointer opacity-60 hover:opacity-100"
                  onClick={() => {
                    const resetMap = {
                      price: "all",
                      rating: null,
                      sort: "default",
                      search: "",
                      instructor: null,
                    };

                    updateFilters({
                      [item.key]: resetMap[item.key],
                    });
                  }}
                />
              </div>
            ))}
          </div>

          {/* LOADING FIRST */}
          {loadingList && courses.length === 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          {/* EMPTY STATE */}
          {!loadingList && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Filter size={36} className="opacity-40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Không tìm thấy khóa học
              </h3>
              <p className="text-sm opacity-60 max-w-md">
                Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm nội dung
                phù hợp hơn.
              </p>
            </div>
          )}

          {/* GRID */}
          {courses.length > 0 && (
            <>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((course) => (
                  <CardCourse key={course.id} course={course} />
                ))}
              </div>

              {/* LOAD MORE */}
              {hasNext && (
                <div className="flex justify-center mt-14">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="
                      px-8 py-3
                      rounded-xl
                      bg-primary
                      text-sm font-medium
                      hover:opacity-90
                      transition
                      disabled:opacity-50
                    "
                  >
                    {loadingMore ? "Đang tải..." : "Tải thêm khóa học"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseCategoryPage;
