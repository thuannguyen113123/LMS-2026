import React from "react";

const ShortAnswer = ({ selected, locked, onSelect }) => {
  return (
    <textarea
      value={selected || ""}
      disabled={locked}
      onChange={(e) => onSelect(e.target.value)}
      rows={3}
      className={`w-full p-3 sm:p-4 md:p-4 rounded-lg sm:rounded-xl border text-sm sm:text-base md:text-[15px] lg:text-base leading-relaxed resize-y min-h-[100px] sm:min-h-[120px] md:min-h-[140px] ${
        locked
          ? "border-gray-200 bg-gray-50 cursor-not-allowed"
          : "border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
      } outline-none transition`}
      placeholder="Nhập câu trả lời..."
    />
  );
};

export default ShortAnswer;
