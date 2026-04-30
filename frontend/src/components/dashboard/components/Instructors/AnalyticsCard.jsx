import React from "react";

const AnalyticsCard = ({ analytics }) => {
  if (!analytics) return null;

  const stats = [
    {
      label: "Completion Rate",
      value: `${Math.round(analytics.completionRate)}%`,
    },
    {
      label: "Avg Progress",
      value: `${Math.round(analytics.avgLessonProgress)}%`,
    },
    {
      label: "Quiz Success",
      value: `${Math.round(analytics.quizSuccessRate)}%`,
    },
  ];

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Learning Analytics</h3>

      <div className="space-y-4">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between text-sm">
            <span className="opacity-70">{s.label}</span>
            <span className="font-semibold">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsCard;
