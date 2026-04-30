import React, { useCallback, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, Send } from "lucide-react";

import QuizTimer from "./QuizTimer";
import QuizProgress from "./QuizProgress";
import QuizResultModal from "../modal/QuizResultModal";
import QuestionCard from "../common/QuestionCard";
import useQuizTaking from "./../../hooks/Quizz/Public/useQuizTaking";

const QuizTaking = ({ quizId, attemptId, onBack }) => {
  const {
    loading,
    questions,
    currentIndex,
    currentQuestion,
    answers,
    handleAnswer,
    handleSubmit,
    submitted,
    score,
    progress,
    nextQuestion,
    prevQuestion,
    attempt,
  } = useQuizTaking({ quizId, attemptId });

  const [showResult, setShowResult] = useState(false);

  const handleSubmitAndShow = useCallback(async () => {
    await handleSubmit();
    setShowResult(true);
  }, [handleSubmit]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-40 sm:h-52 md:h-64 text-slate-500 text-sm sm:text-base">
        <Loader2 className="animate-spin mr-2" />
        Đang tải bài kiểm tra...
      </div>
    );

  if (!currentQuestion)
    return (
      <div className="text-center py-8 sm:py-10 text-sm sm:text-base">
        Không có câu hỏi.
      </div>
    );

  return (
    <>
      {/* TOP BAR */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {attempt?.startTime && attempt?.quiz?.timeLimit && (
            <QuizTimer
              startTime={attempt.startTime}
              timeLimit={attempt.quiz.timeLimit}
              onTimeUp={handleSubmitAndShow}
              disabled={submitted}
            />
          )}

          <QuizProgress
            total={questions.length}
            progress={progress}
            score={submitted ? score : null}
          />
        </div>
      </div>

      {/* QUESTION */}
      <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-10">
        <div className="rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 transition-all bg-white">
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            answers={answers}
            selected={answers[currentQuestion.id]}
            onAnswer={handleAnswer}
          />
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="sticky bottom-0 z-20 bg-white border-t">
        <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 flex items-center justify-between gap-2">
          {/* Prev */}
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-100"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Trước</span>
          </button>

          {!submitted ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Next */}
              <button
                onClick={nextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight size={16} />
              </button>

              {/* Submit */}
              <button
                onClick={handleSubmitAndShow}
                className="flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                <Send size={16} />
                <span className="hidden sm:inline">Nộp bài</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onBack}
              className="text-indigo-600 font-semibold text-sm sm:text-base"
            >
              Quay lại
            </button>
          )}
        </div>
      </div>

      {/* MODAL */}
      <QuizResultModal
        isOpen={showResult}
        score={score}
        total={questions.length}
        onClose={() => {
          setShowResult(false);
          onBack();
        }}
      />
    </>
  );
};

export default QuizTaking;
