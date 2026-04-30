import React from "react";
import KPICard from "./components/KPICard";

import {
  Users,
  GraduationCap,
  BookOpen,
  ShoppingCart,
  DollarSign,
  MessageCircle,
  School,
  FileText,
} from "lucide-react";

const KPISection = ({ data }) => {
  if (!data) return null;

  const items = [
    {
      label: "Users",
      value: data.totalUsers,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Students",
      value: data.totalStudents,
      icon: GraduationCap,
      color: "text-indigo-500",
    },
    {
      label: "Instructors",
      value: data.totalInstructors,
      icon: School,
      color: "text-purple-500",
    },
    {
      label: "Courses",
      value: data.totalCourses,
      icon: BookOpen,
      color: "text-orange-500",
    },
    {
      label: "Orders",
      value: data.totalOrders,
      icon: ShoppingCart,
      color: "text-pink-500",
    },
    {
      label: "Lessons",
      value: data.totalLessons,
      icon: FileText,
      color: "text-cyan-500",
    },
    {
      label: "Active Chats",
      value: data.activeChats,
      icon: MessageCircle,
      color: "text-green-500",
    },
    {
      label: "Revenue",
      value: data.totalRevenue,
      currency: true,
      icon: DollarSign,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
      {items.map((item) => (
        <KPICard key={item.label} {...item} />
      ))}
    </div>
  );
};

export default KPISection;
