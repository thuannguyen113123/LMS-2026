import React from "react";
import { useSelector } from "react-redux";

import AdminDashboard from "./../../components/dashboard/AdminDashboard";
import InstructorDashboard from "./../../components/dashboard/InstructorDashboard";
import StudentDashboard from "./../../components/dashboard/StudentDashboard";

const DashboardPage = () => {
  const role = useSelector((s) => s.auth.user?.activeRole?.name);

  if (!role) return null;

  if (role === "admin" || role === "superadmin") {
    return <AdminDashboard />;
  }

  if (role === "instructor") {
    return <InstructorDashboard />;
  }

  if (role === "student") {
    return <StudentDashboard />;
  }

  return <div>Bạn không có quyền truy cập dashboard.</div>;
};

export default DashboardPage;
