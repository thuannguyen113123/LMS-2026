import React from "react";
import { Trophy, X } from "lucide-react";

const QuizResultModal = ({ isOpen, onClose, score, total }) => {
  if (!isOpen) return null;

  const percent = (score / total) * 100;
  const grade = ((score / total) * 10).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-[380px] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <Trophy className="text-yellow-500 mb-3" size={42} />
          <h2 className="text-2xl font-bold text-indigo-600 mb-2">
            Kết quả bài thi
          </h2>

          <p className="text-gray-600 mb-1">
            Bạn làm đúng{" "}
            <span className="font-semibold text-green-600">{score}</span> /{" "}
            {total} câu
          </p>

          <p className="text-lg font-semibold text-indigo-700 mb-4">
            Điểm: {grade} / 10
          </p>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className="bg-green-500 h-3 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultModal;
