import React from "react";

const CodingEditor = ({ selected, locked, onSelect }) => {
  return (
    <textarea
      value={selected || ""}
      disabled={locked}
      onChange={(e) => onSelect(e.target.value)}
      spellCheck={false}
      className={`w-full p-3 sm:p-4 md:p-5 font-mono rounded-lg sm:rounded-xl border bg-gray-900 text-green-300 text-xs sm:text-sm md:text-[13px] lg:text-sm leading-relaxed min-h-40 sm:min-h-[220px] md:min-h-[280px] lg:min-h-80 resize-y overflow-auto whitespace-pre-wrap  ${
        locked
          ? "opacity-60 cursor-not-allowed border-gray-700"
          : "border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-400/20"
      } outline-none transition`}
      placeholder="// Viết code của bạn tại đây..."
    />
  );
};

export default CodingEditor;
