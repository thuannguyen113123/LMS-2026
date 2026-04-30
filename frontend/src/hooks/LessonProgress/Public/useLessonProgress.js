import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  completeLesson,
  fetchLessonProgressByCourse,
  getOrCreateLessonProgress,
  submitLessonQuiz,
  updateLessonWatching,
} from "../../../features/lessonProgress/lessonProgressThunks";
import {
  selectAllLessonProgress,
  selectProgressByLesson,
  setCurrentLesson,
} from "../../../features/lessonProgress/lessonProgressSlice";

const useLessonProgress = (lessonId = null) => {
  const dispatch = useDispatch();

  /* ================== STATE ================== */
  const loading = useSelector((state) => state.lessonProgress.loading);
  const error = useSelector((state) => state.lessonProgress.error);
  const currentLessonId = useSelector(
    (state) => state.lessonProgress.currentLessonId
  );

  const allProgress = useSelector(selectAllLessonProgress);

  const lessonProgress = useSelector((state) =>
    lessonId ? selectProgressByLesson(lessonId)(state) : null
  );

  /* ================== DERIVED UI STATE ================== */

  const progressPercent = Math.round(lessonProgress?.progress?.percent ?? 0);

  const status = lessonProgress?.status ?? "not_started";

  /* flags */
  const isCompleted = status === "completed";
  const isQuizPending = status === "quiz_pending";
  const isInProgress = status === "in_progress" || status === "quiz_pending";
  const isLocked = status === "locked";
  const isFailed = status === "failed";

  const MIN_PROGRESS_TO_UNLOCK = 80;

  /* ================== ACTIONS ================== */

  /**
   * Khi user mở lesson
   */
  const openLesson = useCallback(
    async ({ courseId, lessonId, lessonType }) => {
      dispatch(setCurrentLesson(lessonId));

      return dispatch(
        getOrCreateLessonProgress({
          courseId,
          lessonId,
          lessonType,
        })
      );
    },
    [dispatch]
  );

  /**
   * Load progress cho sidebar
   */
  const loadCourseProgress = useCallback(
    (courseId) => {
      return dispatch(fetchLessonProgressByCourse(courseId));
    },
    [dispatch]
  );

  /**
   * Update tiến độ xem video
   */
  const updateWatching = useCallback(
    ({ lessonId, currentTime, duration }) => {
      return dispatch(
        updateLessonWatching({
          lessonId,
          currentTime,
          duration,
        })
      );
    },
    [dispatch]
  );

  /**
   * Complete lesson (reading / video / assignment)
   */
  const markCompleted = useCallback(
    (lessonId) => {
      return dispatch(completeLesson({ lessonId }));
    },
    [dispatch]
  );

  /**
   * Submit quiz
   */
  const submitQuiz = useCallback(
    ({ lessonId, answers }) => {
      return dispatch(
        submitLessonQuiz({
          lessonId,
          answers,
        })
      );
    },
    [dispatch]
  );

  const getProgressByLessonId = useCallback(
    (lessonId) => {
      return allProgress.find((x) => x.lessonId === lessonId) || null;
    },
    [allProgress]
  );

  const canAccessLesson = useCallback(
    (lessonIndex, flatLessons) => {
      if (lessonIndex === 0) return true;

      const prevLesson = flatLessons[lessonIndex - 1];

      const prevProgress = getProgressByLessonId(
        prevLesson._id || prevLesson.id
      );

      if (!prevProgress) return false;

      return (
        prevProgress.status === "completed" ||
        prevProgress.status === "quiz_pending"
      );
    },
    [getProgressByLessonId]
  );
  const isLessonUnlocked = useCallback(
    (lessonId, lessonIndex, flatLessons) => {
      if (lessonIndex === 0) return true;

      const prevLesson = flatLessons[lessonIndex - 1];

      const prevProgress = getProgressByLessonId(
        prevLesson._id || prevLesson.id
      );

      if (!prevProgress) return false;

      return (
        prevProgress.status === "completed" ||
        prevProgress.status === "quiz_pending"
      );
    },
    [getProgressByLessonId]
  );
  /* ================== RETURN ================== */
  return useMemo(
    () => ({
      /* data */
      lessonProgress,
      allProgress,
      currentLessonId,

      /* state */
      loading,
      error,
      status,
      progressPercent,

      /* flags */
      isCompleted,
      isInProgress,
      isLocked,
      isFailed,

      /* actions */
      openLesson,
      loadCourseProgress,
      updateWatching,
      markCompleted,
      submitQuiz,

      /* helpers */
      isLessonUnlocked,
      getProgressByLessonId,
      canAccessLesson,
      isQuizPending,
    }),
    [
      lessonProgress,
      allProgress,
      currentLessonId,
      loading,
      error,
      status,
      progressPercent,
      isCompleted,
      isInProgress,
      isLocked,
      isFailed,
      openLesson,
      loadCourseProgress,
      updateWatching,
      markCompleted,
      submitQuiz,
      isLessonUnlocked,
      getProgressByLessonId,
      canAccessLesson,
      isQuizPending,
    ]
  );
};

export default useLessonProgress;
