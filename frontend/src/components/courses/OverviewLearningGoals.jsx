import { FaCheck } from "react-icons/fa";

const CheckIcon = () => (
  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0">
    <FaCheck className="h-3 w-3" />
  </span>
);

const OverviewLearningGoals = ({ goals = [] }) => {
  if (!goals.length) return null;

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-800  shadow-sm">
      {/* Header */}
      <div className="px-6 pt-6">
        <h2 className="text-lg font-semibold ">Bạn sẽ học được gì</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sau khi hoàn thành khóa học, bạn sẽ nắm vững các nội dung sau
        </p>
      </div>

      {/* Goals */}
      <div className="px-6 pb-6 pt-4">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {goals.map((goal, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckIcon />
              <p className="text-sm leading-relaxed">{goal}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default OverviewLearningGoals;
