import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiHelpCircle } from "react-icons/fi";

import QuizTaking from "../../../components/QuizTaking/QuizTaking";

const QuizTakingPage = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get("attempt");

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
      <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto bg-white shadow-lg rounded-xl md:rounded-2xl border overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 sm:px-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-indigo-50">
              <FiHelpCircle className="text-indigo-600 text-lg sm:text-xl" />
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-semibold text-primary">
                Bài kiểm tra
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Trả lời câu hỏi để hoàn thành bài học
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-primary hover:text-red-500 transition text-sm w-full sm:w-auto border sm:border-none"
          >
            <FiArrowLeft />
            <span className="font-medium hidden sm:inline">Quay lại</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 md:p-6 lg:p-8">
          <QuizTaking quizId={quizId} attemptId={attemptId} />
        </div>
      </div>
    </div>
  );
};

export default QuizTakingPage;
