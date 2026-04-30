import QuizCard from "./QuizCard";

export default function QuizGrid({ quizzes }) {
  return (
    <div
      className="
      grid gap-6
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
    "
    >
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}
