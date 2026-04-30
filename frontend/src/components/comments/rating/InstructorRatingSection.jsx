import StarRating from "./StarRating";
import useInstructorRating from "./../../../hooks/Instructor/Public/useInstructorRating";

export default function InstructorRatingSection({
  instructorId,
  viewerRating,
}) {
  const { rating, rate, remove, hasRated } = useInstructorRating(
    instructorId,
    viewerRating
  );

  if (!instructorId) return null;

  return (
    <div className="rounded-2xl p-6 border border-slate-100 shadow-sm mt-6">
      <h3 className="text-lg font-medium text-primary mb-3">
        Rate this Instructor
      </h3>

      <div className="flex items-center gap-4">
        <StarRating value={rating} onChange={rate} />

        {hasRated && (
          <button
            onClick={remove}
            className="text-xs text-red-500 hover:underline"
          >
            Remove rating
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-2">
        Your rating helps other students choose better instructors.
      </p>
    </div>
  );
}
