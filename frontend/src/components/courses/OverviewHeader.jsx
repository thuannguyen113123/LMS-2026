import React from "react";
import { Star, Clock, Layers } from "lucide-react";

const OverviewHeader = ({ course }) => {
  const updatedDate = new Date(course.updatedAt).toLocaleDateString("vi-VN");

  return (
    <section className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl h-[420px] sm:h-[480px] md:h-[520px] lg:h-[620px] xl:h-[650px]">
      {/* Background Image */}
      <img
        src={course.coverImage}
        alt="cover"
        className="absolute inset-0 w-full h-full object-cover scale-105 sm:scale-110 lg:hover:scale-[1.15] transition-all duration-700"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />

      {/* Glow */}
      <div className="absolute -bottom-20 -left-20 w-[220px] sm:w-[300px] h-[220px] sm:h-[300px] bg-purple-500/40 blur-[120px] rounded-full" />
      <div className="absolute -top-10 -right-10 w-[180px] sm:w-60 h-[180px] sm:h-60 bg-blue-500/30 blur-[110px] rounded-full" />

      {/* Content */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 md:bottom-8 w-[94%] sm:w-[90%] max-w-4xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-3 sm:space-y-4 md:space-y-5 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.35)]">
        {/* Title */}
        <h1 className="text-xl leading-snug sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] tracking-tight">
          {course.title}
        </h1>

        {/* Accent bar */}
        <div className="h-1 sm:h-1.5 w-16 sm:w-20 md:w-24 rounded-full bg-linear-to-r from-gray-300 to-gray-500 shadow-[0_0_10px_3px_rgba(156,163,175,0.5)] animate-pulse" />

        {/* Category */}
        <div className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium bg-white/15 backdrop-blur-lg text-white border border-white/30 rounded-full shadow-lg">
          {course.category?.name}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3 md:mt-4">
          {/* Rating */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 border border-white/30 text-white">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-300" />
            <span className="text-sm sm:text-base font-semibold">
              {course.rating || 0}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 border border-white/30 text-white">
            <Clock className="w-4 h-4" />
            <span className="text-xs sm:text-sm">{course.duration} giờ</span>
          </div>

          {/* Lessons */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 border border-white/30 text-white">
            <Layers className="w-4 h-4" />
            <span className="text-xs sm:text-sm">
              {course.lessonsCount || 0} bài
            </span>
          </div>

          {/* Updated */}
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/25 border border-white/40 text-white text-xs sm:text-sm">
            {updatedDate}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OverviewHeader;
