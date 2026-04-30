import React from "react";
import { CheckCircle } from "lucide-react";

const QuizProgress = ({ score, total, progress }) => {
  const percent = Math.round(progress);

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#4f46e5 ${percent}%, #e5e7eb ${percent}% 100%)`,
        }}
      >
        <div className="w-14 h-14  rounded-full flex items-center justify-center shadow">
          <span className="font-bold text-indigo-600 text-sm">
            {score !== null ? `${score}/${total}` : `${percent}%`}
          </span>
        </div>
      </div>

      <div className="text-sm ">
        <p className="font-semibold ">Tiến độ</p>
        <p>
          {score !== null
            ? "Đã hoàn thành"
            : `${Math.round((percent / 100) * total)} / ${total} câu`}
        </p>
      </div>
    </div>
  );
};

export default QuizProgress;
