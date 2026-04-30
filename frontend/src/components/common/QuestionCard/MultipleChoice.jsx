import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

const MultipleChoice = ({ question, selected, locked, onSelect }) => {
  return (
    <div className="space-y-2 sm:space-y-3">
      {question.options.map((opt, idx) => {
        const isSelected = selected === opt.text;

        return (
          <button
            key={idx}
            disabled={locked}
            onClick={() => onSelect(opt.text)}
            className={`w-full flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border text-left transition-all text-sm sm:text-base md:text-[15px] lg:text-base ${
              isSelected
                ? "border-indigo-600 bg-indigo-50 shadow-sm"
                : "border-gray-300 hover:bg-gray-50"
            } ${
              locked && !isSelected
                ? "opacity-50 cursor-not-allowed"
                : "active:scale-[0.98]"
            }`}
          >
            {/* ICON */}
            <div className="mt-0.5 ">
              {isSelected ? (
                <CheckCircle2 className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Circle className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>

            {/* TEXT */}
            <span className="font-medium leading-relaxed ">{opt.text}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MultipleChoice;
