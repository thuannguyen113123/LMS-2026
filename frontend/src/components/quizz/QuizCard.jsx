import { Link } from "react-router-dom";

const statusConfig = {
  completed: {
    label: "Completed",
    color: "text-green-600 bg-green-500/10",
    cta: "Review",
  },
  pending: {
    label: "Pending",
    color: "text-yellow-600 bg-yellow-500/10",
    cta: "Continue",
  },
  "not-started": {
    label: "Not Started",
    color: "text-gray-500 bg-gray-400/10",
    cta: "Start",
  },
};

export default function QuizCard({ quiz }) {
  const config = statusConfig[quiz.status] || statusConfig["pending"];

  return (
    <Link
      to={`/courses/${quiz.courseSlug}/learning`}
      className=" group relative bg-card border border-border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col gap-4 overflow-hidden"
    >
      {/* HOVER GLOW */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-linear-to-br from-primary/5 to-transparent" />

      {/* COURSE */}
      <p className="text-xs uppercase tracking-wide opacity-60">
        {quiz.courseTitle}
      </p>

      {/* TITLE */}
      <h3 className="font-semibold text-lg leading-snug group-hover:text-primary transition">
        {quiz.title}
      </h3>

      {/* LESSON */}
      <p className="text-sm opacity-70 line-clamp-2">{quiz.lessonTitle}</p>

      {/* PROGRESS */}
      <div>
        <div className="flex justify-between text-xs mb-1 opacity-70">
          <span>Progress</span>
          <span>{quiz.progress}%</span>
        </div>

        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="
              h-full rounded-full
              bg-linear-to-r from-primary to-indigo-400
              transition-all duration-500
            "
            style={{ width: `${quiz.progress}%` }}
          />
        </div>
      </div>

      {/* RESULT (NEW 🔥) */}
      {quiz.score !== null && (
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg">
            Score: {quiz.score}
          </span>

          <span className="opacity-60">Attempts: {quiz.attempts}</span>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-auto flex justify-between items-center">
        <span
          className={`
            text-xs px-3 py-1 rounded-full font-medium
            ${config.color}
          `}
        >
          {config.label}
        </span>

        <span className="text-sm font-medium flex items-center gap-1 group-hover:translate-x-1 transition">
          {config.cta} →
        </span>
      </div>
    </Link>
  );
}
