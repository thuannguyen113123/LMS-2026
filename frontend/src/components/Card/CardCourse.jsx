import { Link } from "react-router-dom";
import { Star, Clock, Bookmark } from "lucide-react";
import useBookmark from "../../hooks/Bookmark/useBookmark";

const CardCourse = ({ course }) => {
  const {
    title,
    slug,
    coverImage,
    category,
    description,
    price,
    discountPrice,
    isFree,
    rating,
    duration,
  } = course;

  const { isBookmarked, onToggle, user } = useBookmark(course.id);

  const hasDiscount = discountPrice && price && discountPrice < price;

  const discountPercent =
    hasDiscount && price
      ? Math.round(((price - discountPrice) / price) * 100)
      : 0;

  return (
    <div className="group flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* IMAGE */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Link to={`/courses/${slug}`}>
          <img
            src={coverImage || "/course-placeholder.jpg"}
            alt={title}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
            -{discountPercent}%
          </div>
        )}
        {user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="absolute top-4 right-4 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 active:scale-90 transition-all duration-300"
          >
            <Bookmark
              size={16}
              className={`transition ${
                isBookmarked
                  ? "fill-amber-400 text-amber-400 scale-110"
                  : "text-white/70 group-hover:text-white"
              }`}
            />
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-1 p-4">
        {/* TOP CONTENT */}
        <div className="space-y-3">
          {category?.name && (
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {category.name}
            </p>
          )}

          {/* Title cố định 2 dòng */}
          <h3 className="font-semibold text-primary line-clamp-2 min-h-10">
            {title}
          </h3>

          {/* Description cố định 2 dòng */}
          <p className="text-sm text-gray-500 line-clamp-2 min-h-10">
            {description}
          </p>

          {/* META */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              <span>{rating?.toFixed(1) || "0.0"}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{duration ? Math.round(duration * 60) : 0} phút</span>
            </div>
          </div>
        </div>

        {/* BOTTOM FIXED */}
        <div className="mt-auto pt-4 space-y-3">
          {/* PRICE */}
          <div className="flex items-center gap-2">
            {isFree ? (
              <span className="font-semibold text-green-600">Miễn phí</span>
            ) : hasDiscount ? (
              <>
                <span className="text-lg font-bold text-primary">
                  {discountPrice?.toLocaleString()}₫
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {price?.toLocaleString()}₫
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-primary">
                {price?.toLocaleString()}₫
              </span>
            )}
          </div>

          {/* CTA */}

          <Link
            to={`/courses/${slug}`}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CardCourse;
