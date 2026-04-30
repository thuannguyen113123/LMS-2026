import React from "react";

const TrueFalse = ({ selected, locked, onSelect }) => {
  const options = [
    { label: "Đúng", value: "True" },
    { label: "Sai", value: "False" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
      {options.map((o) => (
        <button
          key={o.value}
          disabled={locked}
          onClick={() => onSelect(o.value)}
          className={`w-full px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl border font-semibold transition text-sm sm:text-base md:text-lg ${
            selected === o.value
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "border-gray-300 hover:bg-gray-50"
          } ${
            locked ? "opacity-50 cursor-not-allowed" : "active:scale-[0.97]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

export default TrueFalse;
