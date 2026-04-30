import React, { useMemo, useState } from "react";
import {
  FaPlayCircle,
  FaLock,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const GROUP_SIZE = 3;
const PREVIEW_LIMIT = 2;

export default function OverviewSyllabus({ syllabus = [] }) {
  const [openSection, setOpenSection] = useState(0);
  const [openLessonId, setOpenLessonId] = useState(null);

  const sections = useMemo(() => {
    const lessons = syllabus?.[0]?.lessons || [];
    if (!lessons.length) return [];

    const sorted = [...lessons].sort((a, b) => a.order - b.order);
    const previewIds = new Set(sorted.slice(0, PREVIEW_LIMIT).map((l) => l.id));

    const grouped = sorted.reduce((acc, lesson) => {
      const index = Math.ceil(lesson.order / GROUP_SIZE);
      acc[index] ||= [];
      acc[index].push({ ...lesson, preview: previewIds.has(lesson.id) });
      return acc;
    }, {});

    return Object.entries(grouped).map(([index, lessons]) => ({
      title: `Chương ${index}`,
      lessons,
    }));
  }, [syllabus]);

  const toggleLesson = (lesson) => {
    if (!lesson.preview) return;
    setOpenLessonId((prev) => (prev === lesson.id ? null : lesson.id));
  };

  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-lg font-semibold text-primary">
          Nội dung khóa học
        </h2>
      </div>

      {/* Sections */}
      <div className="divide-y border-border">
        {sections.map((section, index) => {
          const isOpen = openSection === index;

          return (
            <div key={index} className="px-6 py-4">
              {/* Section header */}
              <button
                onClick={() => setOpenSection(isOpen ? null : index)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-primary">
                    {section.title}
                  </span>
                  <span className="text-xs opacity-60">
                    {section.lessons.length} bài
                  </span>
                </div>

                {isOpen ? (
                  <FaChevronUp className="opacity-60" />
                ) : (
                  <FaChevronDown className="opacity-60" />
                )}
              </button>

              {/* Lessons */}
              {isOpen && (
                <ul className="mt-4 space-y-2">
                  {section.lessons.map((lesson) => {
                    const isOpenLesson = openLessonId === lesson.id;

                    return (
                      <li key={lesson.id}>
                        <div
                          onClick={() => toggleLesson(lesson)}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 transition
                            ${
                              lesson.preview
                                ? "bg-muted hover:opacity-80 cursor-pointer"
                                : "bg-muted opacity-50 cursor-not-allowed"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {lesson.preview ? (
                              <FaPlayCircle className="shrink-0" />
                            ) : (
                              <FaLock className="shrink-0" />
                            )}

                            <span className="truncate font-medium text-primary">
                              {lesson.title}
                            </span>

                            {lesson.preview && (
                              <span className="text-xs bg-primary-soft px-2 py-0.5 rounded">
                                Preview
                              </span>
                            )}
                          </div>

                          <span className="text-sm opacity-60 shrink-0">
                            {lesson.duration} phút
                          </span>
                        </div>

                        {/* Preview content */}
                        {lesson.preview && isOpenLesson && (
                          <div className="mt-2 ml-10 rounded-xl border border-border bg-muted p-4 text-sm opacity-80 animate-fade-in">
                            {lesson.content}
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
    </section>
  );
}
