import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectEnrollmentByCourseId } from "../../features/enrollment/enrollment.slice";
import { enrollFreeCourse } from "../../features/enrollment/enrollment.thunk";
import { fetchCourseDetailBySlug } from "../../features/courses/coursesThunks";

export default function useEnrollment(
  courseId,
  slug,
  { initialEnrolled = false } = {}
) {
  const dispatch = useDispatch();

  const enrollment = useSelector((state) =>
    selectEnrollmentByCourseId(state, courseId)
  );
  const enrolling = useSelector((state) => state.enrollment.enrolling);

  const [enrollResult, setEnrollResult] = useState(null);

  // Trả về true nếu đã enroll từ API, redux hoặc result
  const enrolled =
    initialEnrolled ||
    !!enrollment ||
    enrollResult?.alreadyEnrolled ||
    enrollResult?.enrolled;

  const handleEnrollFree = async () => {
    if (!courseId || enrolled || enrolling) return;

    const result = await dispatch(enrollFreeCourse(courseId)).unwrap();
    setEnrollResult(result);
    if (result?.enrolled) {
      await dispatch(fetchCourseDetailBySlug(slug));
    }
  };

  return {
    enrolled,
    enrolling,
    handleEnrollFree,
    enrollResult,
  };
}
