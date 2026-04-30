import { useDispatch, useSelector } from "react-redux";
import { closeAttemptDetailModal } from "../../features/studentQuizAttempt/studentQuizAttemptSlice";
import useStudentQuizAttemptDetail from "./../../hooks/StudentQuizAttempt/useStudentQuizAttemptDetail";

function StatCard({ label, value }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-sm text-primary opacity-60">{label}</p>
      <p className="font-semibold text-primary">{value}</p>
    </div>
  );
}

function AnswerCard({ answer, index }) {
  const { question } = answer;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <p className="font-medium text-primary">Question {index + 1}</p>

        <span
          className={`text-xs font-semibold px-2 py-1 rounded
          ${
            answer.isCorrect
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          }`}
        >
          {answer.isCorrect ? "Correct" : "Wrong"}
        </span>
      </div>

      <p className="text-primary opacity-80">{question.content}</p>

      <div className="space-y-2">
        {question.options?.map((opt) => {
          const selected = answer.selectedOptions?.includes(opt.text);
          const correct = question.correctAnswers?.includes(opt.text);

          return (
            <div
              key={opt._id}
              className={`border rounded-md px-3 py-2 text-sm
                ${
                  correct
                    ? "bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700 text-black"
                    : selected
                    ? "bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-700 text-black"
                    : "bg-card border-border"
                }
              `}
            >
              {opt.text}
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="bg-muted border border-border rounded-md p-3 text-sm">
          <p className="font-medium text-primary mb-1">Explanation</p>
          <p className="text-primary opacity-80">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default function AttemptDetailModal() {
  const dispatch = useDispatch();

  const { isOpen, attemptId } = useSelector(
    (s) => s.studentQuizAttempt.detailModal
  );

  const { attempt, answers, loading, loadMore, hasNext, answersLoading } =
    useStudentQuizAttemptDetail(attemptId, isOpen);

  if (!isOpen) return null;

  const statusColor = {
    completed: "bg-green-100 text-green-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      <div className="bg-card w-[1000px] max-h-[90vh] rounded-xl shadow-soft overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold text-primary">Attempt Detail</h2>

          <button
            onClick={() => dispatch(closeAttemptDetailModal())}
            className="text-primary opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto p-6 space-y-6">
          {loading ? (
            <p className="text-primary opacity-60">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4 flex gap-4 items-center">
                  <img
                    src={attempt?.student?.avatar}
                    className="w-14 h-14 rounded-full"
                  />

                  <div>
                    <p className="text-sm text-primary opacity-60">Student</p>
                    <p className="font-semibold text-primary">
                      {attempt?.student?.fullname}
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-primary opacity-60">Quiz</p>
                  <p className="font-semibold text-primary">
                    {attempt?.quiz?.title}
                  </p>

                  <p className="text-xs text-primary opacity-50 mt-1">
                    Course: {attempt?.course?.title}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Score" value={attempt?.score ?? 0} />

                <StatCard
                  label="Duration"
                  value={`${attempt?.duration ?? 0}s`}
                />

                <StatCard
                  label="Started"
                  value={new Date(attempt?.startTime).toLocaleString()}
                />

                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-primary opacity-60">Status</p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      statusColor[attempt?.status]
                    }`}
                  >
                    {attempt?.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-primary">
                  Question Review
                </h3>

                <div className="space-y-4">
                  {answers.map((a, index) => (
                    <AnswerCard key={a.id} answer={a} index={index} />
                  ))}
                </div>

                {hasNext && (
                  <button
                    onClick={loadMore}
                    disabled={answersLoading}
                    className="mt-6 w-full border border-border rounded-lg py-2 bg-card hover:bg-muted transition"
                  >
                    {answersLoading ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
