import { Link } from "react-router-dom";
import CardCourse from "../Card/CardCourse";

const RecommendedCourses = ({ courses, categorySlug }) => {
  if (!courses?.length) return null;

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Khóa học liên quan</h3>

        {categorySlug && (
          <Link
            to={`/categories/${categorySlug}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Xem tất cả →
          </Link>
        )}
      </div>

      {/* Responsive layout */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3 lg:grid-cols-4">
        {courses.map((course) => (
          <div
            key={course.id || course._id}
            className="min-w-[260px] sm:min-w-0 snap-start"
          >
            <CardCourse course={course} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedCourses;
