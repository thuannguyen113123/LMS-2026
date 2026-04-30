import React from "react";
import {
  FiCheckCircle,
  FiCircle,
  FiPlay,
  FiBookOpen,
  FiTarget,
  FiMessageCircle,
  FiLock,
} from "react-icons/fi";
import { MdQuiz } from "react-icons/md";

import QuizSection from "../../components/quizz/QuizSection";
import CommentsSection from "../../components/comments/CommentsSection";
import useLessonProgress from "../../hooks/LessonProgress/Public/useLessonProgress";
import useVideoWatching from "./../../hooks/LessonProgress/Public/useVideoWatching";

const LessonContent = ({ currentLesson, course, quizRef }) => {
  const lessonId = currentLesson?._id || currentLesson?.id || null;

  const { progressPercent, status } = useLessonProgress(lessonId);

  const step1 = progressPercent >= 80;
  const step2 = status === "quiz_pending" || status === "completed";
  const step3 = status === "completed";

  const checklistPercent = Math.round(
    ([step1, step2, step3].filter(Boolean).length / 3) * 100
  );

  const { videoRef, onPause, onEnded } = useVideoWatching(lessonId);

  if (!currentLesson) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10 lg:space-y-12 pb-16 md:pb-20">
      {/* ================= VIDEO ================= */}
      <div className="space-y-5">
        <div className="relative w-full rounded-3xl overflow-hidden bg-black shadow-xl">
          <video
            key={lessonId}
            ref={videoRef}
            src={currentLesson.videoUrl}
            poster={course.coverImage}
            controls
            onPause={onPause}
            onEnded={onEnded}
            className="relative w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden bg-black shadow-xl"
          />
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tiến độ xem</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Resume watching */}
        {progressPercent > 5 && progressPercent < 100 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3   border border-indigo-200 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium">
              <FiPlay />
              Bạn đang xem dở bài học này
            </div>

            <button
              onClick={() => videoRef.current?.play()}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              Tiếp tục xem
            </button>
          </div>
        )}
      </div>

      {/* ================= TITLE ================= */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
          {currentLesson.title}
        </h1>

        <p className="text-sm text-gray-500">
          Thuộc khóa học{" "}
          <span className="font-medium text-gray-800">{course.title}</span>
        </p>
      </div>

      {/* ================= CHECKLIST ================= */}
      <div className="relative  rounded-3xl p-8 shadow-lg border border-gray-100 space-y-6 overflow-hidden">
        {/* Background subtle gradient */}
        <div className="absolute inset-0  pointer-events-none" />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl  text-indigo-600">
                <FiCheckCircle />
              </div>
              Checklist hoàn thành
            </h3>

            <span className="text-sm text-gray-500">{checklistPercent}%</span>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {/* STEP 1 */}
            <div
              className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 ${
                status === "quiz_pending" || status === "completed"
                  ? " border border-green-200"
                  : " border border-gray-200"
              }`}
            >
              <div>
                {status === "quiz_pending" || status === "completed" ? (
                  <FiCheckCircle className="text-green-500 mt-1" />
                ) : (
                  <FiCircle className="text-gray-400 mt-1" />
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium text-sm">Xem ít nhất 80% video</p>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div
              className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 ${
                status === "quiz_pending" || status === "completed"
                  ? "border border-green-200"
                  : "border border-gray-200"
              }`}
            >
              <div>
                {status === "quiz_pending" || status === "completed" ? (
                  <FiCheckCircle className="text-green-500 mt-1" />
                ) : (
                  <FiCircle className="text-gray-400 mt-1" />
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium text-sm">Hoàn thành bài học</p>
                <p className="text-xs text-gray-500 mt-1">
                  Hệ thống sẽ tự đánh dấu khi đủ điều kiện
                </p>
              </div>
            </div>

            {/* STEP 3 */}
            <div
              className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 ${
                status === "completed"
                  ? "border border-green-200"
                  : "border border-gray-200"
              }`}
            >
              <div>
                {status === "completed" ? (
                  <FiCheckCircle className="text-green-500 mt-1" />
                ) : (
                  <FiCircle className="text-gray-400 mt-1" />
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium text-sm">Hoàn thành quiz</p>
                <p className="text-xs text-gray-500 mt-1">
                  Trả lời đúng để hoàn tất bài học
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl md:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 space-y-5 md:space-y-6">
        <h3 className="text-xl font-semibold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
            <FiTarget />
          </div>
          Mục tiêu bài học
        </h3>

        <ul className="grid gap-3 md:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <li className="flex items-start gap-3 p-4  rounded-2xl border border-gray-100 hover:shadow-md transition">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
            <span className="text-gray-700">
              Nắm được kiến thức cốt lõi và hiểu bản chất vấn đề
            </span>
          </li>

          <li className="flex items-start gap-3 p-4  rounded-2xl border border-gray-100 hover:shadow-md transition">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
            <span className="text-gray-700">
              Biết cách áp dụng vào tình huống thực tế
            </span>
          </li>

          <li className="flex items-start gap-3 p-4  rounded-2xl border border-gray-100 hover:shadow-md transition">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
            <span className="text-gray-700">
              Sẵn sàng làm quiz kiểm tra và hoàn thành bài học
            </span>
          </li>
        </ul>
      </div>

      <div className="relative  rounded-3xl p-8 shadow-lg border border-gray-100 overflow-hidden">
        <div className="absolute inset-0  pointer-events-none" />
        <div className="relative space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                  <FiBookOpen />
                </div>
                Nội dung bài học
              </h3>

              <p className="text-sm text-gray-500">
                Hãy đọc kỹ mô tả và chuẩn bị trước khi bắt đầu
              </p>
            </div>

            {currentLesson.duration && (
              <div className="px-4 py-2 bg-gray-100 rounded-xl text-xs text-gray-600 font-medium">
                ⏱ {currentLesson.duration} phút
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Description */}
          <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none  text-gray-700 leading-relaxed">
            {currentLesson.description ? (
              <p>{currentLesson.description}</p>
            ) : (
              <p>
                Trong bài học này, bạn sẽ tìm hiểu chi tiết về{" "}
                <span className="font-semibold text-indigo-600">
                  {currentLesson.title}
                </span>
                .
                <br />
                <br />
                Hãy xem kỹ video, ghi chú lại những điểm quan trọng và hoàn
                thành bài kiểm tra phía dưới để đảm bảo bạn nắm vững kiến thức.
              </p>
            )}
          </div>

          {/* Callout box */}
          <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
            <div className="text-indigo-600 mt-1">💡</div>
            <div className="text-sm text-indigo-800">
              Mẹo: Ghi chú lại những điểm quan trọng trong quá trình học để dễ
              dàng ôn tập sau này.
            </div>
          </div>
        </div>
      </div>

      <div
        ref={quizRef}
        className="relative p-4 sm:p-6 lg:p-8 rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="absolute inset-0  pointer-events-none" />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-2xl font-semibold flex items-center gap-3">
              <div className="p-2 rounded-xl  text-indigo-600">
                <MdQuiz />
              </div>
              Kiểm tra kiến thức
            </h3>

            <span className="text-sm text-gray-500">
              Đánh giá mức độ hiểu bài của bạn
            </span>
          </div>

          {/* QUIZ CONTENT */}
          {status === "quiz_pending" || status === "completed" ? (
            <div className="space-y-6">
              {/* Ready banner */}
              <div className="flex items-center gap-3 p-4  border border-green-200 rounded-2xl text-green-700 text-sm">
                Bạn đã mở khóa bài kiểm tra. Hãy hoàn thành để kết thúc bài học.
              </div>

              {/* Quiz component */}
              <div className="rounded-2xl p-4 border border-gray-100">
                <QuizSection lessonId={lessonId} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Locked card */}
              <div className="flex items-start gap-4 p-6 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <div className="p-3 bg-yellow-100 rounded-xl text-yellow-700">
                  <FiLock className="w-5 h-5 md:w-6 md:h-6" />
                </div>

                <div className="flex-1 space-y-3">
                  <p className="font-semibold text-yellow-800">
                    Quiz đang bị khóa
                  </p>

                  <p className="text-sm text-yellow-700">
                    Bạn cần xem ít nhất <strong>80% video</strong> để mở khóa
                    bài kiểm tra.
                  </p>

                  {/* Progress mini bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-yellow-700">
                      <span>Tiến độ hiện tại</span>
                      <span>{progressPercent}%</span>
                    </div>

                    <div className="w-full h-2 bg-yellow-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Encourage message */}
              <div className="text-center text-sm text-gray-500">
                Hoàn thành video để tiếp tục hành trình học tập
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ================= DISCUSSION ================= */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <FiMessageCircle className="text-indigo-600" />
          Thảo luận bài học
        </h3>

        <CommentsSection targetType="lesson" targetId={lessonId} />
      </div>
    </div>
  );
};

export default LessonContent;
