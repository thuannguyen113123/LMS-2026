import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchCourses } from "../../features/search/searchThunks";
import {
  selectSearchCourses,
  selectSearchLoading,
} from "../../features/search/searchSlice";

import { useNavigate } from "react-router-dom";
export default function HeroSearch() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const courses = useSelector(selectSearchCourses);
  const loading = useSelector(selectSearchLoading);
  const [input, setInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(input.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    if (!debouncedQuery) return;

    dispatch(
      searchCourses({
        q: debouncedQuery,
        page: 1,
        limit: 5,
      })
    );

    setShowDropdown(true);
  }, [debouncedQuery, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!input.trim()) return;
      navigate(`/search?q=${input.trim()}`);
      setShowDropdown(false);
    },
    [input, navigate]
  );

  const handleClickCourse = (course) => {
    console.log("course", course);
    navigate(`/courses/${course.slug || course.id}`);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="hero-item flex gap-3 bg-card border border-border rounded-xl p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => {
            if (courses.length > 0) setShowDropdown(true);
          }}
          className="flex-1 px-3 py-2 bg-transparent outline-none"
          placeholder="Search courses..."
        />
      </form>

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10">
          {loading && (
            <div className="p-4 text-sm text-muted">Searching...</div>
          )}

          {!loading && courses.length === 0 && (
            <div className="p-4 text-sm text-muted">No results found</div>
          )}
          {!loading &&
            courses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleClickCourse(course)}
                className="flex gap-3 p-3 hover:bg-muted cursor-pointer transition"
              >
                <img
                  src={course.thumbnail || "/placeholder.png"}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{course.title}</span>
                  <span className="text-xs text-muted">
                    {course.category?.name}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
