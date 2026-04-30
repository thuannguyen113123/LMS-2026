import { Navigate, Outlet, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  selectCourseBySlug,
  selectCourseDetailLoading,
} from "../../features/courses/coursesSlice";

const ProtectedCourseRoute = () => {
  const { slug } = useParams();

  const loading = useSelector(selectCourseDetailLoading);
  const { user } = useSelector((s) => s.auth);
  const course = useSelector(selectCourseBySlug(slug));

  // ✅ chỉ chờ detail loading
  if (loading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!course?.canAccess) {
    return <Navigate to={`/courses/${slug}`} replace />;
  }

  return <Outlet context={{ course }} />;
};

export default ProtectedCourseRoute;
