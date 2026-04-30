import React from "react";

import StudentKPISection from "./components/Student/StudentKPISection";
import StudentChartsSection from "./components/Student/StudentChartsSection";
import StudentLearningSection from "./components/Student/StudentLearningSection";
import StudentPanelsSection from "./components/Student/StudentPanelsSection";
import { useDashboard } from "./../../hooks/Dashboard/useDashboard";

const StudentDashboard = () => {
  const { kpis, charts, learning, panels, loading } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-72 bg-muted rounded-xl" />
        <div className="h-72 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-primary">
          Learning Overview
        </h2>
        <StudentKPISection data={kpis} />
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-primary">
          Learning Progress
        </h2>
        <StudentChartsSection data={charts} />
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-primary">Activity</h2>
        <StudentPanelsSection data={panels} />
      </section>
      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-primary">
          Continue Learning
        </h2>
        <StudentLearningSection data={learning} />
      </section>
    </div>
  );
};

export default StudentDashboard;
