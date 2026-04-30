import { BookOpen, Trophy, CheckCircle, TrendingUp } from "lucide-react";
import KPICard from "../KPICard";

const StudentKPISection = ({ data }) => {
  if (!data) return null;

  const items = [
    {
      label: "Enrolled Courses",
      value: data.enrolledCourses,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      label: "Completed Courses",
      value: data.completedCourses,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      label: "Certificates",
      value: data.certificates,
      icon: Trophy,
      color: "text-yellow-500",
    },
    {
      label: "Progress %",
      value: data.currentProgress,
      icon: TrendingUp,
      color: "text-purple-500",
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

export default StudentKPISection;
