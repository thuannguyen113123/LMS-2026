import React from "react";
import {
  PlayCircle,
  CheckCircle,
  ArrowRight,
  FileText,
  Clock,
  BookOpen,
} from "lucide-react";

import useLessonProgress from "../../hooks/LessonProgress/Public/useLessonProgress";

const LessonSidePanel = ({
  currentLesson,
  activeLesson,
  totalLessons,
  flatLessons,
  onScrollToQuiz,
  onGoToLesson,
}) => {
  const lessonId = currentLesson?._id || currentLesson?.id;

  const { status, progressPercent, isCompleted, isInProgress } =
    useLessonProgress(lessonId);

  if (!currentLesson) return null;

  /* ================= NEXT LESSON ================= */
  const nextLesson = flatLessons?.[activeLesson + 1] ?? null;

  /* ================= PRIMARY ACTION ================= */
  const primaryAction = (() => {
    /**
     * QUIZ REQUIRED
     */
    if (status === "quiz_pending") {
      return {
        label: "Làm quiz",
        icon: <FileText size={18} />,
        color: "bg-yellow-500 hover:bg-yellow-600",
        action: () => {
          onScrollToQuiz?.();
        },
      };
    }

    /**
     * COMPLETED → NEXT LESSON
     */
    if (isCompleted && nextLesson) {
      return {
        label: "Bài tiếp theo",
        icon: <ArrowRight size={18} />,
        color: "bg-indigo-600 hover:bg-indigo-700",
        action: () => {
          onGoToLesson?.(activeLesson + 1);
        },
      };
    }

    /**
     * IN PROGRESS → RESUME
     */
    if (isInProgress) {
      return {
        label: "Tiếp tục xem",
        icon: <PlayCircle size={18} />,
        color: "bg-indigo-600 hover:bg-indigo-700",
        action: () => {
          // emit event cho video player resume
          window.dispatchEvent(new CustomEvent("lesson:resume"));
        },
      };
    }

    /**
     * NOT STARTED
     */
    return {
      label: "Bắt đầu học",
      icon: <PlayCircle size={18} />,
      color: "bg-indigo-600 hover:bg-indigo-700",
      action: () => {
        window.dispatchEvent(new CustomEvent("lesson:start"));
      },
    };
  })();

  return (
    <aside className="space-y-6">
      {/* ================= LESSON SNAPSHOT ================= */}
      <div className="border border-white rounded-3xl p-6 shadow-md shadow-black/5 space-y-4">
        <h3 className="font-semibold text-lg">Bài học này</h3>

        <div className="space-y-2 text-sm text-primary">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-500" />
            <span className="font-medium text-primary">
              {currentLesson.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{currentLesson.duration || "—"} phút</span>
          </div>

          <div className="flex items-center gap-2">
            <PlayCircle size={16} />
            <span>{currentLesson.type || "Video"}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tiến độ</span>
            <span>{progressPercent}%</span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-indigo-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================= PRIMARY ACTION ================= */}
      <div className="border border-white rounded-3xl p-6 shadow-md shadow-black/5 space-y-4">
        <button
          onClick={primaryAction.action}
          className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition ${primaryAction.color}`}
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm text-green-600 justify-center">
            <CheckCircle size={16} />
            <span>Đã hoàn thành bài học</span>
          </div>
        )}
      </div>

      {/* ================= NEXT LESSON ================= */}
      {nextLesson && (
        <div className="border border-white rounded-3xl p-6 shadow-md shadow-black/5 space-y-4">
          <h3 className="font-semibold text-lg">Bài tiếp theo</h3>

          <div className="space-y-2 text-sm">
            <div className="font-medium text-primary">{nextLesson.title}</div>

            <div className="flex items-center gap-2 text-primary">
              <Clock size={14} />
              <span>{nextLesson.duration || "—"} phút</span>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Bài {activeLesson + 2}/{totalLessons}
          </div>
        </div>
      )}
    </aside>
  );
};

export default LessonSidePanel;
