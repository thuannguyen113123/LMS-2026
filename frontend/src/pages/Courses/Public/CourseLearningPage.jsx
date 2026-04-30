import { useOutletContext } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import useCourseLessons from "../../../hooks/Course/Public/useCourseLessons";
import useLessonProgress from "../../../hooks/LessonProgress/Public/useLessonProgress";
import SidebarLessons from "../../../components/lesson/SidebarLessons";
import LessonHeader from "../../../components/lesson/LessonHeader";
import LessonContent from "../../../components/lesson/LessonContent";
import LessonSidePanel from "../../../components/lesson/LessonSidePanel";

const CourseLearningPage = () => {
  const { course } = useOutletContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState(0);

  const quizRef = useRef(null);

  const scrollToQuiz = () => {
    quizRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    quizRef.current?.classList.add("ring-2", "ring-indigo-500");

    setTimeout(() => {
      quizRef.current?.classList.remove("ring-2", "ring-indigo-500");
    }, 1500);
  };

  const { lessons, loading: lessonsLoading } = useCourseLessons({
    courseId: course?.id,
  });

  const {
    loadCourseProgress,
    openLesson,
    getProgressByLessonId,
    isLessonUnlocked,
    canAccessLesson,
  } = useLessonProgress();

  useEffect(() => {
    if (!course) return;
    loadCourseProgress(course._id || course.id);
  }, [course, loadCourseProgress]);

  const syllabus = useMemo(() => {
    if (!lessons?.length) return [];

    return [
      {
        title: "Danh sách bài học",
        lessons: [...lessons]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((l) => ({
            ...l,
            durationText: l.duration ? `${l.duration} phút` : "—",
          })),
      },
    ];
  }, [lessons]);

  const flatLessons = useMemo(
    () => syllabus.flatMap((s) => s.lessons || []),
    [syllabus]
  );

  const totalLessons = flatLessons.length;
  const currentLesson = flatLessons[activeLesson] || null;
  const lessonKey = currentLesson?._id || currentLesson?.id || null;

  const courseId = course?._id || course?.id;

  useEffect(() => {
    if (!lessonKey || !courseId) return;

    openLesson({
      courseId,
      lessonId: lessonKey,
      lessonType: currentLesson?.type || "video",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonKey, courseId]);

  const handleSetActiveLesson = useCallback(
    (index) => {
      if (!canAccessLesson(index, flatLessons)) return;
      setActiveLesson(index);
    },
    [canAccessLesson, flatLessons]
  );
  const goToLesson = useCallback(
    (index) => {
      if (!canAccessLesson(index, flatLessons)) return;
      setActiveLesson(index);
    },
    [canAccessLesson, flatLessons]
  );

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm sm:text-base">
        Không tìm thấy khóa học.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-app overflow-hidden">
      {/* SIDEBAR */}
      <SidebarLessons
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        syllabus={syllabus}
        activeLesson={activeLesson}
        setActiveLesson={handleSetActiveLesson}
        course={course}
        getProgressByLessonId={getProgressByLessonId}
        isLessonUnlocked={isLessonUnlocked}
        canAccessLesson={canAccessLesson}
        flatLessons={flatLessons}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <div className="sticky top-0 z-30 bg-app border-b">
          <LessonHeader
            setSidebarOpen={setSidebarOpen}
            currentLesson={currentLesson}
            course={course}
            activeLesson={activeLesson}
            totalLessons={totalLessons}
          />
        </div>

        {/* CONTENT */}
        <div className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[2.2fr_1fr] gap-4 sm:gap-6 lg:gap-8">
              {/* LESSON */}
              <div className="bg-app rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 min-w-0">
                <LessonContent
                  loading={lessonsLoading}
                  currentLesson={currentLesson}
                  course={course}
                  quizRef={quizRef}
                />
              </div>

              {/* SIDE PANEL */}
              <div className="lg:sticky lg:top-24 h-fit order-first lg:order-last">
                <LessonSidePanel
                  currentLesson={currentLesson}
                  activeLesson={activeLesson}
                  totalLessons={totalLessons}
                  flatLessons={flatLessons}
                  onScrollToQuiz={scrollToQuiz}
                  onGoToLesson={goToLesson}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearningPage;
