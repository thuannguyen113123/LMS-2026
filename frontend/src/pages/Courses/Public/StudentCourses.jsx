import MyCourseCard from "../../../components/Card/MyCourseCard";
import FilterSelect from "../../../components/common/FilterSelect";
import SearchInput from "../../../components/common/SearchInput";
import CourseOverviewSkeleton from "./../../../components/skeleton/CourseOverviewSkeleton";
import useMyCourses from "./../../../hooks/Course/Public/useMyCourses";

const sortOptions = [
  { value: "recent", label: "Recently accessed" },
  { value: "progress", label: "Progress" },
  { value: "title", label: "Title" },
];

const typeOptions = [
  { value: "All", label: "All courses" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const StudentCourses = () => {
  const {
    courses,
    loading,
    isEmpty,
    hasNext,
    loadMore,
    search,
    sort,
    type,
    setSearch,
    setFilter,
  } = useMyCourses();
  {
    loading && courses.length === 0 && (
      <div className="grid gap-6">
        {[...Array(4)].map((_, i) => (
          <CourseOverviewSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
          <p className="text-muted-foreground">
            Continue your learning journey
          </p>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="bg-card px-4 py-2 rounded-lg border">
            <p className="text-muted-foreground">Courses</p>
            <p className="font-semibold">{courses.length}</p>
          </div>

          <div className="bg-card px-4 py-2 rounded-lg border">
            <p className="text-muted-foreground">In Progress</p>
            <p className="font-semibold">
              {courses.filter((c) => c.progress < 100).length}
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-card rounded-xl p-4">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your courses..."
        />

        <div className="flex gap-3">
          <FilterSelect
            options={sortOptions}
            value={sort}
            onChange={(v) => setFilter("sort", v)}
            placeholder="Sort"
          />

          <FilterSelect
            options={typeOptions}
            value={type}
            onChange={(v) => setFilter("type", v)}
            placeholder="Status"
          />
        </div>
      </div>

      {/* EMPTY */}
      {isEmpty && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-muted-foreground">
            You haven't started any courses yet
          </p>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map((course) => (
          <MyCourseCard key={course.id} course={course} />
        ))}
      </div>

      {/* LOAD MORE */}
      {hasNext && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="
              px-6 py-2 rounded-lg
              bg-primary text-white
              hover:opacity-90 transition
              disabled:opacity-50
            "
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
