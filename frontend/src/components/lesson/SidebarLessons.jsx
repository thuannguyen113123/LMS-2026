import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, X, Star } from "lucide-react";
import {
  FaPlayCircle,
  FaRegCircle,
  FaCheckCircle,
  FaClock,
  FaLock,
} from "react-icons/fa";

const SidebarLessons = ({
  sidebarOpen,
  setSidebarOpen,
  syllabus,
  activeLesson,
  setActiveLesson,
  course,
  getProgressByLessonId,
  canAccessLesson,
  flatLessons,
}) => {
  const [openSection, setOpenSection] = useState(0);

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 w-full sm:w-[340px] md:w-[320px] lg:w-[360px] xl:w-[380px] transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } flex flex-col bg-card border-r border-border`}
    >
      {/* ================= HEADER ================= */}
      <div className="px-3 sm:px-5 py-3 sm:py-4 sticky top-0 z-50 bg-card border-b border-border flex items-start gap-3 sm:gap-4">
        {/* COVER */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex items-center justify-center bg-muted">
          {course.coverImage ? (
            <img
              src={course.coverImage}
              alt=""
              className="object-cover w-full h-full"
            />
          ) : (
            <BookOpen className="w-7 h-7 text-primary" />
          )}
        </div>

        {/* INFO */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2">
            {course.title}
          </h2>

          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>4.8 • {course.students || 1500} học viên</span>
          </div>
        </div>

        {/* CLOSE */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-800"
        >
          <X size={22} />
        </button>
      </div>

      {/* ================= LESSON LIST ================= */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {syllabus.map((section, sIndex) => {
          const isOpen = openSection === sIndex;

          return (
            <div key={sIndex}>
              {/* SECTION HEADER */}
              <button
                onClick={() => setOpenSection(isOpen ? null : sIndex)}
                className="w-full flex items-center justify-between px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-lg text-sm font-semibold hover:bg-muted transition"
              >
                <span>{section.title}</span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {/* LESSONS */}
              {isOpen && (
                <ul className="mt-2 space-y-1 animate-fade-in">
                  {section.lessons.map((lesson, i) => {
                    const index =
                      syllabus
                        .slice(0, sIndex)
                        .reduce((a, s) => a + s.lessons.length, 0) + i;

                    const isUnlocked = canAccessLesson(index, flatLessons);
                    const active = index === activeLesson;

                    const progress = getProgressByLessonId(
                      lesson._id || lesson.id
                    );
                    const status = progress?.status;
                    const percent = Math.round(
                      progress?.progress?.percent ?? 0
                    );

                    return (
                      <li
                        key={lesson._id || lesson.id || index}
                        onClick={() => {
                          if (!isUnlocked) return;
                          setActiveLesson(index);
                        }}
                        className={`px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-lg transition-all flex flex-col gap-2 ${
                          !isUnlocked
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer hover:bg-muted"
                        } ${active ? "bg-primary-soft text-primary" : ""}`}
                      >
                        {/* ROW */}
                        <div className="flex items-start gap-3">
                          {/* ICON */}
                          <div className="mt-1">
                            {!isUnlocked ? (
                              <FaLock className="text-gray-400" />
                            ) : active ? (
                              <FaPlayCircle className="text-indigo-600 text-base sm:text-lg animate-pulse" />
                            ) : status === "completed" ? (
                              <FaCheckCircle className="text-green-500" />
                            ) : (
                              <FaRegCircle className="text-gray-400 group-hover:text-indigo-500" />
                            )}
                          </div>

                          {/* CONTENT */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug line-clamp-2 ${
                                active ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {lesson.order}. {lesson.title}
                            </p>

                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <FaClock />
                              <span>{lesson.duration} phút</span>
                            </div>

                            {!isUnlocked && (
                              <p className="text-xs text-gray-400 mt-1">
                                Hoàn thành ≥ 80% bài trước
                              </p>
                            )}
                          </div>

                          {active && (
                            <span className="text-xs font-semibold text-indigo-600">
                              Đang học
                            </span>
                          )}
                        </div>

                        {/* PROGRESS */}
                        {progress && (
                          <div className="w-full h-1 bg-gray-200 rounded">
                            <div
                              className="h-1 bg-indigo-500 rounded transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default SidebarLessons;
