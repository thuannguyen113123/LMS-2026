import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const models = [
  "courses",
  "students",
  "instructors",
  "quizzes",
  "modules",
  "orders",
  "payments",
];

const HeroPreview = () => {
  const previewRef = useRef();

  useEffect(() => {
    gsap.from(previewRef.current.children, {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      delay: 0.4,
    });
  }, []);

  return (
    <div
      ref={previewRef}
      className="
        bg-card
        p-6
        rounded-xl
        shadow-xl
        border border-border
      "
    >
      <div className="font-semibold mb-4">System Models</div>

      <div className="grid grid-cols-2 gap-3">
        {models.map((model) => (
          <div
            key={model}
            className="
              bg-muted
              px-4 py-2
              rounded-lg
              text-sm
            "
          >
            {model}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroPreview;
