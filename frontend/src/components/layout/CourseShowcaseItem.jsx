import React from "react";
import { Link } from "react-router-dom";

import { Bookmark } from "lucide-react";
import useBookmark from "../../hooks/Bookmark/useBookmark";

const CourseShowcaseItem = ({ course, variant = "normal" }) => {
  const { isBookmarked, onToggle, user } = useBookmark(course.id);

  const sizeClasses = {
    large: "md:col-span-2 md:row-span-2",
    medium: "md:col-span-2",
    normal: "",
  };

  const price = course.isFree
    ? "Free"
    : course.discountPrice
    ? `${course.discountPrice.toLocaleString()}đ`
    : `${course.price?.toLocaleString()}đ`;

  const description = course.description?.replace(/\n/g, " ");

  return (
    <article
      data-course-card
      className={`group relative overflow-hidden rounded-3xl bg-card transition-all duration-500 hover:-translate-y-2 cursor-pointer ${sizeClasses[variant]}`}
    >
      <Link to={`/courses/${course.slug}`} className="block h-full">
        {/* IMAGE */}
        <div className="absolute inset-0">
          <img
            src={course.coverImage}
            alt={course.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          <div className="flex gap-2">
            <span className="px-3 py-1 text-xs rounded-full bg-white/90 text-black">
              {course.category?.name}
            </span>
            <span className="px-2 py-1 text-[11px] rounded bg-primary text-white">
              NEW
            </span>
          </div>
        </div>
        {user && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(e);
            }}
            className="absolute top-4 right-4 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 active:scale-90 transition-all duration-300"
          >
            <Bookmark
              className={`w-5 h-5 transition-all duration-300 ${
                isBookmarked
                  ? "fill-amber-400 text-amber-400 scale-110"
                  : "text-white/70 group-hover:text-white"
              }`}
            />
          </button>
        )}

        <div className="absolute bottom-0 p-6 text-white w-full">
          <h3 className="text-lg md:text-xl font-semibold mb-2 line-clamp-2">
            {course.title}
          </h3>

          <p className="text-sm text-white/80 line-clamp-2 mb-4">
            {description}
          </p>
          <span className="px-2 py-1 text-xs rounded-md bg-black/50 text-white backdrop-blur">
            ⭐ {course.rating || "New"}
          </span>
          {/* FOOTER */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-red-500">{price}</span>

            {course.discountPrice && (
              <span className="text-sm line-through text-white/60">
                {course.price.toLocaleString()}đ
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default CourseShowcaseItem;
