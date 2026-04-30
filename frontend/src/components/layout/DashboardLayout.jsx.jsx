import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";

import Overlay from "./Overlay";
import DashboardHeader from "./DashboardHeader";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const closeSidebar = () => setSidebarOpen(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} />

      {sidebarOpen && <Overlay onClick={closeSidebar} />}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
        `}
      >
        <DashboardHeader onToggleSidebar={toggleSidebar} />

        <main className="flex-1 pt-16 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-14 3xl:px-20 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
