import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicLessons } from "../../features/lessons/lessonsThunks";
import {
  selectPublicLessons,
  selectPublicLessonsLoading,
} from "../../features/lessons/lessonsSlice";

export default function useLessonsByCourse(slug) {
  const dispatch = useDispatch();

  const lessons = useSelector(selectPublicLessons);
  const lessonsLoading = useSelector(selectPublicLessonsLoading);

  useEffect(() => {
    if (!slug) return;

    dispatch(
      fetchPublicLessons({
        slug,
        limit: 50,
      })
    );
  }, [dispatch, slug]);

  return {
    lessons,
    lessonsLoading,
  };
}
