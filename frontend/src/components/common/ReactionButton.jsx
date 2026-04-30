import React, { useState, useRef, useEffect } from "react";
import { FiSmile } from "react-icons/fi";

const reactions = ["❤️", "😂", "👍", "😮", "😢", "😡"];

const ReactionButton = ({ onReact, currentReaction }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`p-1 rounded-full shadow transition ${
          currentReaction ? "bg-green-100" : "bg-white hover:bg-gray-100"
        }`}
      >
        {currentReaction || <FiSmile />}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 bg-white shadow-xl rounded-full p-2 border z-50">
          {reactions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                onReact(r); // 🔥 unified toggle

                setOpen(false);
              }}
              className={`text-xl hover:scale-125 transition-transform ${
                r === currentReaction ? "opacity-40" : ""
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionButton;
