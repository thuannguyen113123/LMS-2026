import React, { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  selectCourseBySlug,
  selectCourseDetailLoading,
} from "../../features/courses/coursesSlice";
import { fetchCourseDetailBySlug } from "../../features/courses/coursesThunks";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";

const CourseLayout = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const courseSelector = useMemo(() => selectCourseBySlug(slug), [slug]);

  const course = useSelector(courseSelector);

  useEffect(() => {
    if (slug && !course) {
      dispatch(fetchCourseDetailBySlug(slug));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  const loading = useSelector(selectCourseDetailLoading);

  if (loading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading course...
      </div>
    );
  }

  return <Outlet context={{ course }} />;
};

export default CourseLayout;
