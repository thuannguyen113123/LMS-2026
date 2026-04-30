import React from "react";
import { useNavigate } from "react-router-dom";

const CourseCardProccess = ({ course }) => {
  const navigate = useNavigate();
  return (
    <div className="group relative w-full min-h-[360px] sm:min-h-[400px] lg:min-h-[420px] bg-card border border-border rounded-2xl overflow-hidden grid xl:grid-cols-[1.5fr_1fr]">
      <div className="absolute inset-0 opacity-40 pointer-events-none bg-linear-to-br from-transparent via-transparent to-primary/10" />

      <div className="relative p-10 flex flex-col justify-center gap-6">
        <div className="space-y-3">
          <div className="text-xs opacity-60 tracking-wide uppercase">
            Continue course
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight">
            {course?.title}
          </h3>

          <p className="text-sm opacity-70">
            Instructor • {course?.instructor}
          </p>
        </div>

        <p className="text-sm opacity-80 max-w-[520px] leading-relaxed">
          You're currently on
          <span className="font-medium"> {course?.currentLesson}</span>. Keep
          going to maintain your learning streak.
        </p>

        {/* progress */}
        <div className="space-y-3 pt-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${course?.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm opacity-70">
            <span>{course?.progress}% completed</span>
            <span>{course?.durationLeft} remaining</span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            className="px-4 py-2  rounded-lg bg-primary text-sm font-medium transition hover:scale-105"
            onClick={() => navigate(`/courses/${course?.slug}/learning`)}
          >
            Resume learning
          </button>

          <button
            className="text-sm opacity-70 hover:opacity-100 transition"
            onClick={() => navigate(`/courses/${course?.slug}`)}
          >
            View details
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative flex flex-col justify-between border-l border-border bg-muted/30">
        {/* image */}
        <div className="relative h-40 sm:h-[180px] lg:h-[220px] overflow-hidden">
          <img
            src={course?.cover}
            className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
        </div>

        {/* stats */}
        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs opacity-60 uppercase">Current lesson</p>

            <p className="font-medium mt-1">{course?.currentLesson}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-background/40 border border-border rounded-lg p-3">
              <p className="opacity-60 text-xs">Progress</p>
              <p className="font-medium text-base">{course?.progress}%</p>
            </div>

            <div className="bg-background/40 border border-border rounded-lg p-3">
              <p className="opacity-60 text-xs">Remaining</p>
              <p className="font-medium text-base">{course?.durationLeft}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CourseCardProccess;
