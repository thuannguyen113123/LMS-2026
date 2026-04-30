import React from "react";
import { Menu, BookOpen, Clock } from "lucide-react";
import useLessonProgress from "../../hooks/LessonProgress/Public/useLessonProgress";

const STATUS_META = {
  not_started: {
    label: "Chưa học",
    class: "bg-gray-100 text-gray-600",
  },
  in_progress: {
    label: "Đang học",
    class: "bg-indigo-100 text-indigo-600",
  },
  completed: {
    label: "Đã hoàn thành",
    class: "bg-green-100 text-green-600",
  },
  locked: {
    label: "Chưa mở",
    class: "bg-red-100 text-red-600",
  },
  quiz_pending: {
    label: "Chờ quiz",
    class: "bg-yellow-100 text-yellow-700",
  },
};

const LessonHeader = ({
  setSidebarOpen,
  currentLesson,
  course,
  activeLesson,
  totalLessons,
}) => {
  const { status, progressPercent } = useLessonProgress(
    currentLesson?._id || currentLesson?.id
  );

  const statusMeta = STATUS_META[status];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 gap-3 sm:gap-4">
        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Mobile sidebar button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl bg-muted hover:bg-gray-200 transition"
          >
            <Menu size={20} />
          </button>

          {/* Lesson info */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold leading-snug truncate">
              {currentLesson?.title || "Đang tải bài học..."}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1 flex-wrap">
              <BookOpen size={14} />

              <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                {course?.title}
              </span>

              <span className="w-1 h-1 rounded-full bg-gray-400 hidden sm:block" />

              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                {course?.category?.name || "Danh mục"}
              </span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Status */}
          {statusMeta && (
            <span
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold whitespace-nowrap ${statusMeta.class}`}
            >
              {status === "in_progress"
                ? `${progressPercent || 0}%`
                : statusMeta.label}
            </span>
          )}

          {/* Duration (hide mobile) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-sm">
            <Clock size={14} className="text-indigo-500" />
            <span className="font-medium">
              {currentLesson?.duration || "—"} phút
            </span>
          </div>

          {/* Lesson index */}
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold shadow-sm whitespace-nowrap">
            {activeLesson + 1}/{totalLessons}
          </div>
        </div>
      </div>
    </header>
  );
};

export default LessonHeader;
