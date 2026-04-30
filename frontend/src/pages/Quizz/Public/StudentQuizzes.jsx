import SearchInput from "../../../components/common/SearchInput";
import FilterSelect from "../../../components/common/FilterSelect";
import QuizGrid from "../../../components/quizz/QuizGrid";
import useMyQuizzes from "./../../../hooks/Quizz/Public/useMyQuizzes";

const statusOptions = [
  { label: "All", value: "All" },
  { label: "Completed", value: "completed" },
  { label: "In Progress", value: "in-progress" },
  { label: "Not Started", value: "not-started" },
];

const StudentQuizzes = () => {
  const {
    quizzes,
    loading,
    isEmpty,
    hasNext,
    search,
    status,
    setSearch,
    setStatus,
    loadMore,
  } = useMyQuizzes();

  return (
    <div className="bg-app min-h-screen p-6 md:p-10">
      <div className=" mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Quizzes</h1>
          <p className="opacity-70">Continue your learning progress</p>

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm opacity-70">Total</p>
              <p className="text-xl font-bold">{quizzes.length}</p>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm opacity-70">Completed</p>
              <p className="text-xl font-bold text-green-500">
                {quizzes.filter((q) => q.status === "completed").length}
              </p>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm opacity-70">in progress</p>
              <p className="text-xl font-bold text-yellow-500">
                {quizzes.filter((q) => q.status === "in-progress").length}
              </p>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm opacity-70">Not Started</p>
              <p className="text-xl font-bold text-gray-400">
                {quizzes.filter((q) => q.status === "not-started").length}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ FILTER BAR (MATCH HOOK) */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-card rounded-xl p-4 mb-2">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your quizzes..."
          />

          <FilterSelect
            options={statusOptions}
            value={status}
            onChange={setStatus}
            placeholder="Status"
          />
        </div>

        {/* CONTENT */}
        {loading && <p className="mt-6">Loading quizzes...</p>}

        {isEmpty && !loading && (
          <div className="bg-card border border-border rounded-xl p-10 text-center mt-6">
            No quizzes found.
          </div>
        )}

        {!isEmpty && !loading && <QuizGrid quizzes={quizzes} />}

        {hasNext && !loading && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              className="bg-primary px-6 py-3 rounded-xl"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizzes;
