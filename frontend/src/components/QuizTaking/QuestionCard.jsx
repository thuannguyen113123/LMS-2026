import React from "react";

const QuestionCard = ({ question, index, total, onAnswer, selected }) => {
  if (!question) return null;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">
        Question {index + 1} of {total}
      </p>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {question.content}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onAnswer(question._id, opt.text)}
            className={`p-3 border rounded-xl text-left ${
              selected === opt.text
                ? "bg-indigo-100 border-indigo-500"
                : "bg-white hover:bg-gray-50 border-gray-300"
            }`}
          >
            {String.fromCharCode(65 + i)}. {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
