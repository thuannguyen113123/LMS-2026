import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";

import {
  fetchStudentQuizAttemptDetailById,
  fetchAttemptAnswers,
} from "../../features/studentQuizAttempt/studentQuizAttemptThunks";
import { selectAttemptDetailLoading } from "../../features/studentQuizAttempt/studentQuizAttemptSlice";

export default function useStudentQuizAttemptDetail(attemptId, isOpen) {
  const dispatch = useDispatch();

  const { currentAttempt, answersByAttempt, answersLoading } = useSelector(
    (s) => s.studentQuizAttempt
  );
  const loading = useSelector(selectAttemptDetailLoading);
  const answersBucket = answersByAttempt?.[attemptId];

  const answers = answersBucket
    ? answersBucket.ids.map((id) => answersBucket.entities[id])
    : [];

  useEffect(() => {
    if (!attemptId || !isOpen) return;

    dispatch(fetchStudentQuizAttemptDetailById(attemptId));
  }, [attemptId, isOpen, dispatch]);

  useEffect(() => {
    if (!attemptId || !isOpen) return;

    if (!answersBucket) {
      dispatch(fetchAttemptAnswers({ attemptId }));
    }
  }, [attemptId, isOpen, answersBucket, dispatch]);

  const loadMore = useCallback(() => {
    if (!answersBucket?.hasNext || answersLoading) return;

    dispatch(
      fetchAttemptAnswers({
        attemptId,
        cursor: answersBucket.nextCursor,
      })
    );
  }, [dispatch, attemptId, answersBucket, answersLoading]);

  return {
    attempt: currentAttempt,
    answers,
    loading,
    answersLoading,
    hasNext: answersBucket?.hasNext,
    loadMore,
  };
}
