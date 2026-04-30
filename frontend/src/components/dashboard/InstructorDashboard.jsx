import React from "react";

import KPISection from "./KPISection";
import InstructorCharts from "./components/Instructors/InstructorChartsSection";
import InstructorPanels from "./components/Instructors/InstructorPanels";
import { useDashboard } from "../../hooks/Dashboard/useDashboard";

const InstructorDashboard = () => {
  const { kpis, charts, panels, analytics, loading } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-72 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary">
          Instructor Overview
        </h2>

        <KPISection data={kpis} />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary">
          Course Performance
        </h2>

        <InstructorCharts data={charts} analytics={analytics} />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary">Recent Activity</h2>

        <InstructorPanels data={panels} />
      </section>
    </div>
  );
};

export default InstructorDashboard;
