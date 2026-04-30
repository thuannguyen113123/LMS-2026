import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";

const SubmitButton = ({ onClick, loading, children, disabled }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || disabled) return;

      // Enter hoặc Ctrl/Cmd + Enter
      if (
        e.key === "Enter" &&
        (e.ctrlKey ||
          e.metaKey ||
          document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        onClick?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClick, loading, disabled]);

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
      className="w-full bg-linear-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-medium shadow-lg hover:opacity-90 transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : children}
    </button>
  );
};

export default SubmitButton;
