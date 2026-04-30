import React, { useLayoutEffect, useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { removeToast } from "../../features/ui/uiSlice";
import { FiCheckCircle, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";

const Toast = ({
  id,
  type = "info",
  title,
  message,
  duration = 5000,
  action,
}) => {
  const dispatch = useDispatch();
  const [countdown, setCountdown] = useState(duration / 1000);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messageRef = useRef(null);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    if (duration === 0 || paused) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          dispatch(removeToast(id));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, dispatch, id, paused]);

  useLayoutEffect(() => {
    if (messageRef.current) {
      setShowToggle(messageRef.current.scrollHeight > 80);
    }
  }, [message]);

  const getTypeStyle = () => {
    switch (type) {
      case "success":
        return "text-success";
      case "error":
        return "text-error";
      case "warning":
        return "text-warning";
      default:
        return "text-info";
    }
  };

  return (
    <div className="toast bg-card border border-border rounded-lg shadow-md p-4 max-w-sm relative mb-3 z-30 animate-slide-left">
      {/* Close + Toggle */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {showToggle && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-primary opacity-60 hover:opacity-100"
          >
            {expanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
        )}
        <button
          onClick={() => dispatch(removeToast(id))}
          className="text-primary opacity-60 hover:opacity-100"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        {type === "success" && (
          <FiCheckCircle className={getTypeStyle()} size={18} />
        )}
        <strong className="text-primary text-base">{title}</strong>
      </div>

      {/* Message */}
      <p
        ref={messageRef}
        className="text-sm transition-all duration-300"
        style={{
          maxHeight: expanded ? "none" : 80,
          overflow: "hidden",
          color: "var(--color-text)",
        }}
      >
        {message}
      </p>

      {/* Action */}
      {action && (
        <button
          className="mt-3 px-3 py-1 rounded bg-primary-soft hover:bg-muted transition"
          onClick={() => {
            action.onClick();
            dispatch(removeToast(id));
          }}
        >
          {action.label}
        </button>
      )}

      {/* Countdown */}
      {countdown > 0 && (
        <div className="mt-3 text-xs opacity-60 select-none">
          Close in <strong>{countdown}s</strong>{" "}
          <button onClick={() => setPaused(true)} className="underline">
            pause
          </button>
        </div>
      )}

      {/* Progress bar */}
      {duration > 0 && !paused && (
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-muted overflow-hidden rounded-b-lg">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{
              width: `${(countdown / (duration / 1000)) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
