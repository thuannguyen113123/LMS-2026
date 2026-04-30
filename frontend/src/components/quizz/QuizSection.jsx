import React from "react";
import {
  FiLoader,
  FiClock,
  FiHelpCircle,
  FiRepeat,
  FiTarget,
  FiPlay,
} from "react-icons/fi";
import { HiOutlineAcademicCap } from "react-icons/hi";

import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { startStudentQuizAttempt } from "../../features/studentQuizAttempt/studentQuizAttemptThunks";
import useLessonOrCourseQuiz from "./../../hooks/Lesson/Public/useLessonOrCourseQuiz";
import { openAttemptDetailModal } from "../../features/studentQuizAttempt/studentQuizAttemptSlice";

const QuizSection = ({ lessonId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { slug: courseSlug } = useParams();

  const { quizzes, loading, isStarting } = useLessonOrCourseQuiz({
    lessonId,
    courseSlug,
  });

  const quiz = quizzes?.[0] || null;

  const handleStartQuiz = async () => {
    try {
      const res = await dispatch(
        startStudentQuizAttempt({
          quizId: quiz._id || quiz.id,
          lessonId,
        })
      ).unwrap();

      if (res.canReview && res.attemptId) {
        dispatch(openAttemptDetailModal(res.attemptId));
        return;
      }

      navigate(
        `/quiz/${quiz._id || quiz.id}?attempt=${
          res.attempt._id || res.attempt.id
        }`
      );
    } catch (err) {
      console.log(err);
    }
  };
  if (loading)
    return (
      <div className="flex justify-center items-center py-16 text-gray-500 text-lg">
        <FiLoader className="animate-spin mr-3 text-indigo-600" size={22} />
        Đang tải bài kiểm tra...
      </div>
    );

  return (
    <div className="mt-14">
      {!quiz ? (
        <div className="p-10 text-center rounded-3xl border border-dashed border-gray-300   shadow-sm">
          <HiOutlineAcademicCap
            size={40}
            className="mx-auto mb-4 text-gray-400"
          />
          <p className="text-lg font-medium">
            Chưa có bài quiz nào cho bài học này
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Vui lòng quay lại sau hoặc kiểm tra bài học khác
          </p>
        </div>
      ) : (
        <div className="relative backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-indigo-100">
          {/* Gradient background */}
          <div className="absolute inset-0 pointer-events-none" />

          <div className="relative p-10 space-y-10">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-6">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl  shadow-lg">
                  <HiOutlineAcademicCap size={26} />
                </div>

                <div>
                  <h3 className="text-2xl font-bold  leading-tight">
                    {quiz.title}
                  </h3>

                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className="px-3 py-1  rounded-full font-medium">
                      {quiz.type === "practice" ? "Practice" : "Exam"}
                    </span>

                    {quiz.scope === "lesson" && (
                      <span className="px-3 py-1  rounded-full">
                        Lesson Quiz
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Passing score */}
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-semibold shadow-sm">
                <FiTarget />
                Điểm đạt: {quiz.passingScore}%
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Info grid */}
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              {/* Questions */}
              <div className="flex items-center gap-4 border border-gray-200 hover-bg-muted transition-all p-5 rounded-2xl group">
                <FiHelpCircle
                  size={20}
                  className="text-indigo-500 group-hover:scale-110 transition"
                />
                <div>
                  <p className="font-semibold ">Phạm vi {quiz.scope}</p>
                  <p className="text-gray-500 text-xs">Trắc nghiệm kiến thức</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-4  hover-bg-muted border border-gray-200 transition-all p-5 rounded-2xl group">
                <FiClock
                  size={20}
                  className="text-indigo-500 group-hover:scale-110 transition"
                />
                <div>
                  <p className="font-semibold ">
                    {quiz.timeLimit
                      ? `${quiz.timeLimit} phút`
                      : "Không giới hạn"}
                  </p>
                  <p className="text-gray-500 text-xs">Thời gian làm bài</p>
                </div>
              </div>

              {/* Attempts */}
              <div className="flex items-center gap-4  hover-bg-muted border border-gray-200 transition-all p-5 rounded-2xl group">
                <FiRepeat
                  size={20}
                  className="text-indigo-500 group-hover:scale-110 transition"
                />
                <div>
                  <p className="font-semibold">
                    {quiz.maxAttempts || "Không giới hạn"}
                  </p>
                  <p className="text-gray-500 text-xs">Số lần làm tối đa</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <button
                onClick={handleStartQuiz}
                disabled={isStarting}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-blue-500 text-white font-semibold shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Đang tạo bài...
                  </>
                ) : (
                  <>
                    <FiPlay />
                    Bắt đầu làm bài
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSection;
