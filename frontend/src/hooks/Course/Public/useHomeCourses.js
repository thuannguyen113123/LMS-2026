import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchPublicCourses } from "../../../features/courses/coursesThunks";
import { selectPublicCourses } from "../../../features/courses/coursesSlice";

export default function useHomeCourses(type = "new") {
  const dispatch = useDispatch();

  const courses = useSelector(selectPublicCourses);
  const { loading } = useSelector((state) => state.courses.loading.publicList);

  useEffect(() => {
    dispatch(
      fetchPublicCourses({
        limit: 4,
        filters: { type },
      })
    );
  }, [dispatch, type]);

  return { courses, loading };
}
