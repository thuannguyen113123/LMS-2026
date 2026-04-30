import { FaFire, FaClock } from "react-icons/fa";

export default function SortToggle({ value = "new", onChange }) {
  const toggle = () => {
    const next = value === "new" ? "hot" : "new";
    onChange?.(next);
  };

  return (
    <div
      onClick={toggle}
      className="relative flex items-center w-48 h-10 p-1 rounded-full backdrop-blur-md border border-gray-300/50 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer select-none hover-bg-muted"
    >
      {/* Slider background */}
      <div
        className={`absolute top-1 left-1 h-8 w-24 rounded-full bg-indigo-600 shadow-md transition-all duration-300 ${
          value === "new" ? "translate-x-0" : "translate-x-24"
        }`}
      />

      {/* NEWEST */}
      <div className="relative z-10 flex items-center justify-center w-24 gap-2 text-sm font-medium">
        <FaClock
          className={`
            transition-all duration-300
            ${
              value === "new"
                ? "text-white scale-110 drop-shadow"
                : "text-gray-400"
            }
          `}
        />
        <span
          className={`
            transition-all duration-300
            ${value === "new" ? "text-primary font-semibold" : "text-blue-500"}
          `}
        >
          Mới nhất
        </span>
      </div>

      {/* HOT */}
      <div className="relative z-10 flex items-center justify-center w-24 gap-2 text-sm font-medium">
        <FaFire
          className={`
            transition-all duration-300
            ${
              value === "hot"
                ? "text-white scale-110 drop-shadow"
                : "text-gray-400"
            }
          `}
        />
        <span
          className={`
            transition-all duration-300
            ${value === "hot" ? "text-white font-semibold" : "text-gray-400"}
          `}
        >
          Phổ biến
        </span>
      </div>
    </div>
  );
}
