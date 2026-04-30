import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchStudentQuizAttemptDetailById,
  submitStudentQuizAttempt,
} from "../../../features/studentQuizAttempt/studentQuizAttemptThunks";
import { selectAllQuestions } from "../../../features/questions/questionsSlice";
import { fetchQuestionsByQuiz } from "../../../features/questions/questionsThunks";
import { selectAttemptDetailLoading } from "../../../features/studentQuizAttempt/studentQuizAttemptSlice";

export default function useQuizTaking({ quizId, attemptId }) {
  const dispatch = useDispatch();

  const questions = useSelector(selectAllQuestions);

  const { currentAttempt } = useSelector((state) => state.studentQuizAttempt);

  const loading = useSelector(selectAttemptDetailLoading);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // tránh double submit
  const submittingRef = useRef(false);

  const submitted = useMemo(
    () => currentAttempt?.status === "completed",
    [currentAttempt]
  );

  const score = useMemo(() => currentAttempt?.score ?? null, [currentAttempt]);

  useEffect(() => {
    if (!attemptId) return;

    dispatch(fetchStudentQuizAttemptDetailById(attemptId));
  }, [attemptId, dispatch]);

  useEffect(() => {
    if (!quizId) return;

    dispatch(fetchQuestionsByQuiz(quizId));
  }, [quizId, dispatch]);

  const handleAnswer = useCallback((questionId, selected) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selected,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentAttempt?.id) return;
    if (submitted) return;
    if (submittingRef.current) return;

    submittingRef.current = true;

    try {
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, selectedOption]) => ({
          question: questionId,
          selectedOptions: Array.isArray(selectedOption)
            ? selectedOption
            : [selectedOption],
        })
      );

      await dispatch(
        submitStudentQuizAttempt({
          attemptId: currentAttempt.id,
          answers: formattedAnswers,
        })
      ).unwrap();

      dispatch(fetchStudentQuizAttemptDetailById(currentAttempt.id));
    } catch (err) {
      submittingRef.current = false;
      alert(err || "Không thể nộp bài");
    }
  }, [dispatch, answers, currentAttempt, submitted]);

  /** =============================
   * NAVIGATION (UI ONLY)
   * ============================= */
  const nextQuestion = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  }, [questions.length]);

  const prevQuestion = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  /** =============================
   * PROGRESS
   * ============================= */
  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((a) => a !== null && a !== undefined)
        .length,
    [answers]
  );

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return (answeredCount / questions.length) * 100;
  }, [answeredCount, questions.length]);

  /** =============================
   * RETURN API
   * ============================= */
  return {
    loading,

    // backend data
    attempt: currentAttempt,
    submitted,
    score,

    // questions
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex],

    // answers
    answers,
    handleAnswer,

    // actions
    handleSubmit,
    nextQuestion,
    prevQuestion,

    // ui stats
    progress,
  };
}
