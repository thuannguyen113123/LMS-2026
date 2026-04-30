import { Star } from "lucide-react";
import { useState } from "react";

export default function StarRating({
  value = 0,
  onChange,
  size = 22,
  readonly = false,
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = hover ? star <= hover : star <= value;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange?.(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={size}
              className={
                active ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
