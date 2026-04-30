import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookmarks } from "../../features/student/studentsThunks";

export default function useBookmarks() {
  const dispatch = useDispatch();
  const bookmarks = useSelector((state) => state.students.bookmarks);
  const loading = useSelector((state) => state.students.bookmarkLoading);
  const pagination = useSelector((state) => state.students.paginationBookmarks);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    price: "all",
    rating: null,
  });

  useEffect(() => {
    dispatch(fetchBookmarks({ cursor: null, limit: 12 }));
  }, [dispatch]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      dispatch(
        fetchBookmarks({
          cursor: pagination.nextCursor,
          limit: 12,
          isLoadMore: true,
        })
      );
    }
  };

  const filteredBookmarks = bookmarks.filter((b) => {
    const course = b.course;
    if (!course) return false;

    // Filter theo price
    if (filters.price === "free" && !course.isFree) return false;
    if (filters.price === "paid" && course.isFree) return false;

    // Filter theo rating
    if (filters.rating && course.rating < filters.rating) return false;

    // Filter theo search
    if (search && !course.title.toLowerCase().includes(search.toLowerCase()))
      return false;

    return true;
  });

  return {
    bookmarks: filteredBookmarks,
    loading,
    handleLoadMore,
    hasNext: pagination.hasMore,
    search,
    setSearch,
    filters,
    setFilters,
  };
}
