import { ChevronLeft, ChevronRight } from "lucide-react";

export default function NavigationButton({ type, className }) {
  const Icon = type === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      className={`absolute top-1/2 -translate-y-1/2 
        bg-white shadow-md p-3 rounded-full z-10 
        hover:bg-purple-600 hover:text-white transition 
        ${className}
      `}
    >
      <Icon size={18} />
    </button>
  );
}
