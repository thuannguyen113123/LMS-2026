import { useDispatch, useSelector } from "react-redux";

import { useCallback, useMemo } from "react";
import {
  rateInstructor,
  removeInstructorRating,
} from "../../../features/student/studentsThunks";
import useModal from "../../useModal";

export default function useInstructorRating(instructorId, viewerRating = 0) {
  const dispatch = useDispatch();

  const student = useSelector((s) => s.students.currentStudent);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  const authModal = useModal("AUTH");

  const rating = useMemo(() => {
    if (!student) return viewerRating ?? 0;

    const localRating = student.instructorRatings?.find((x) => {
      const id =
        typeof x.instructor === "string"
          ? x.instructor
          : x.instructor?.id || x.instructor?._id;

      return id === instructorId;
    })?.rating;

    return localRating !== undefined ? localRating : viewerRating ?? 0;
  }, [student, instructorId, viewerRating]);

  const rate = useCallback(
    (value) => {
      if (!isAuthenticated) {
        authModal.open({ initialStep: "login" });
        return;
      }

      dispatch(
        rateInstructor({
          instructorId,
          rating: value,
        })
      );
    },
    [dispatch, instructorId, isAuthenticated, authModal]
  );

  const remove = useCallback(() => {
    if (!isAuthenticated) {
      authModal.open({ initialStep: "login" });
      return;
    }

    dispatch(
      removeInstructorRating({
        instructorId,
      })
    );
  }, [dispatch, instructorId, isAuthenticated, authModal]);

  return {
    rating,
    rate,
    remove,
    hasRated: rating > 0,
  };
}
