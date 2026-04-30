import { useDispatch, useSelector } from "react-redux";
import { selectIsBookmarked } from "../../features/student/studentsSlice";
import { toggleBookmark } from "../../features/student/studentsThunks";

export default function useBookmark(courseId) {
  const dispatch = useDispatch();

  const isBookmarked = useSelector(selectIsBookmarked(courseId));
  const user = useSelector((state) => state.auth.user);

  const bookmarkLoading = useSelector(
    (state) => state.students.bookmarkLoading
  );

  const onToggle = async (e) => {
    e?.stopPropagation(); // tránh click lan sang link
    if (bookmarkLoading) return; // tránh spam nhiều lần

    try {
      await dispatch(toggleBookmark(courseId)).unwrap();
      // unwrap() sẽ throw nếu bị reject, có thể dùng để handle lỗi toast nếu muốn
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  return { isBookmarked, onToggle, bookmarkLoading, user };
}
