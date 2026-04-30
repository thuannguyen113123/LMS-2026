import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchPublicQuizzes } from "../../../features/quizzes/quizzesThunks";
import { selectQuizzesByScope } from "../../../features/quizzes/quizzesSlice";
import { selectStartAttemptLoading } from "../../../features/studentQuizAttempt/studentQuizAttemptSlice";

const useLessonOrCourseQuiz = ({ lessonId = null, courseSlug = null }) => {
  const dispatch = useDispatch();

  const quizzes = useSelector((state) =>
    selectQuizzesByScope(state, { lessonId, courseSlug })
  );

  const { nextCursor, hasNext } = useSelector(
    (state) => state.quizzes.paginationPublic
  );
  const isStarting = useSelector(selectStartAttemptLoading);

  const loading = useSelector((state) => state.quizzes.loading.public);
  const error = useSelector((state) => state.quizzes.errorCode);

  useEffect(() => {
    if (!lessonId && !courseSlug) return;

    dispatch(
      fetchPublicQuizzes({
        filters: {
          scope: lessonId ? "lesson" : "course",
          lessonId,
          courseSlug,
        },
      })
    );
  }, [lessonId, courseSlug, dispatch]);

  const loadMore = () => {
    if (!hasNext) return;

    dispatch(
      fetchPublicQuizzes({
        cursor: nextCursor,
        isLoadMore: true,
        filters: {
          scope: lessonId ? "lesson" : "course",
          lessonId,
          courseSlug,
        },
      })
    );
  };

  return {
    quizzes,
    loading,
    error,
    hasNext,
    loadMore,
    isStarting,
  };
};

export default useLessonOrCourseQuiz;
