import React from "react";
import { useDashboard } from "../../hooks/Dashboard/useDashboard";
import KPISection from "./KPISection";
import ChartsSection from "./ChartsSection";
import PanelsSection from "./PanelsSection";

const AdminDashboard = () => {
  const { kpis, charts, panels, loading } = useDashboard();

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
    <div className="space-y-12">
      {/* KPI */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary">Overview</h2>
        <KPISection data={kpis} />
      </section>

      {/* Charts */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary">Analytics</h2>
        <ChartsSection data={charts} />
      </section>

      {/* Panels */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary">Recent Activity</h2>
        <PanelsSection data={panels} />
      </section>
    </div>
  );
};

export default AdminDashboard;
