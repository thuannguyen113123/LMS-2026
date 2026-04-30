import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLessons } from "../../../features/lessons/lessonsThunks";
import { selectLessonsByCourse } from "../../../features/lessons/lessonsSlice";

const useCourseLessons = ({ courseId }) => {
  const dispatch = useDispatch();

  const lessons = useSelector((state) =>
    selectLessonsByCourse(state, courseId)
  );

  const { loading, error } = useSelector((state) => state.lessons);

  useEffect(() => {
    if (!courseId) return;

    if (lessons.length > 0) return;

    dispatch(fetchLessons({ courseId, limit: 100 }));
  }, [dispatch, courseId, lessons.length]);

  return { lessons, loading, error };
};

export default useCourseLessons;
