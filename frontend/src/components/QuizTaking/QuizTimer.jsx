import React, { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

const QuizTimer = ({ startTime, timeLimit, onTimeUp, disabled }) => {
  const calledRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);

  // 👉 luôn giữ callback mới nhất nhưng không làm re-create effect
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // 👉 tính thời gian còn lại
  const calcSecondsLeft = () => {
    const end = new Date(startTime).getTime() + timeLimit * 60 * 1000;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState(calcSecondsLeft);

  // 👉 reset khi startTime hoặc timeLimit thay đổi
  useEffect(() => {
    setSecondsLeft(calcSecondsLeft());
    calledRef.current = false;
  }, [startTime, timeLimit]);

  // ✅ TIMER CHỈ CHẠY 1 LẦN
  useEffect(() => {
    if (disabled) return;

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);

          if (!calledRef.current) {
            calledRef.current = true;
            onTimeUpRef.current?.(); // ✅ dùng ref, không bị stale
          }

          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [disabled]);

  //  format time
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const danger = secondsLeft <= 60;

  return (
    <div
      className={`flex items-center gap-2 font-semibold ${
        danger ? "text-red-600" : "text-primary"
      }`}
    >
      <Clock size={18} />
      <span>
        {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
      </span>
    </div>
  );
};

export default QuizTimer;
