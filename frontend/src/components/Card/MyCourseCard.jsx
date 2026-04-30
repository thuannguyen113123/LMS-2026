import { Link } from "react-router-dom";
import { PlayCircle, Clock } from "lucide-react";

const MyCourseCard = ({ course }) => {
  const {
    slug,
    title,
    instructor,
    cover,
    progress,
    currentLesson,
    durationLeft,
  } = course;

  return (
    <Link
      to={`/courses/${slug}`}
      className="
        group flex gap-5
        bg-card border border-border
        rounded-xl p-4
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
      "
    >
      {/* COVER */}
      <div className="w-44 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-1 justify-between">
        {/* TOP */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>

          <p className="text-sm text-gray-500">{instructor}</p>

          {/* PROGRESS */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progress}% completed</span>
            </div>

            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-gray-500 space-y-1">
            <div>{currentLesson}</div>

            {durationLeft > 0 && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {durationLeft} min left
              </div>
            )}
          </div>

          <button
            className="
              flex items-center gap-2
              bg-primary text-white
              px-4 py-2 rounded-lg
              text-sm font-medium
              hover:opacity-90 transition
            "
          >
            <PlayCircle size={16} />
            Continue
          </button>
        </div>
      </div>
    </Link>
  );
};

export default MyCourseCard;
