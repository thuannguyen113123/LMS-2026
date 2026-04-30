import React from "react";
import { CheckCircle, HelpCircle, Tag, Award } from "lucide-react";

import MultipleChoice from "./MultipleChoice";
import TrueFalse from "./TrueFalse";
import ShortAnswer from "./ShortAnswer";
import CodingEditor from "./CodingEditor";

const difficultyStyle = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const QuestionCard = ({
  question,
  index,
  total,
  selected,
  onAnswer,
  locked = false,
}) => {
  const questionId = question.id || question._id;

  const renderType = () => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <MultipleChoice
            question={question}
            selected={selected}
            locked={locked}
            onSelect={(option) => onAnswer(questionId, option)}
          />
        );
      case "true_false":
        return (
          <TrueFalse
            selected={selected}
            locked={locked}
            onSelect={(option) => onAnswer(questionId, option)}
          />
        );
      case "short_answer":
        return (
          <ShortAnswer
            selected={selected}
            locked={locked}
            onSelect={(value) => onAnswer(questionId, value)}
          />
        );
      case "coding":
        return (
          <CodingEditor
            selected={selected}
            locked={locked}
            onSelect={(code) => onAnswer(questionId, code)}
          />
        );
      default:
        return (
          <p className="text-red-600 text-sm">Loại câu hỏi chưa được hỗ trợ</p>
        );
    }
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-white">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-primary font-medium">
            Câu hỏi {index + 1} / {total}
          </p>

          <div className="flex items-center gap-1 sm:gap-2 text-xs text-primary">
            <Award size={12} className="sm:w-4 sm:h-4" />
            {question.points || 1} điểm
          </div>
        </div>

        <span
          className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold capitalize ${
            difficultyStyle[question.difficulty]
          }`}
        >
          {question.difficulty}
        </span>
      </div>

      {/* QUESTION CONTENT */}
      <div className="flex items-start gap-2 sm:gap-3">
        <HelpCircle className="text-indigo-600 mt-1 w-4 h-4 sm:w-5 sm:h-5" />
        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-primary leading-relaxed">
          {question.content}
        </h2>
      </div>

      {/* TAGS */}
      {question.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs bg-slate-100 text-slate-600 rounded-full"
            >
              <Tag size={10} className="sm:w-3 sm:h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ANSWER */}
      <div className="pt-3 sm:pt-4 border-t">{renderType()}</div>
    </div>
  );
};

export default QuestionCard;
