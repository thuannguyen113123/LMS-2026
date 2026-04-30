import { useAccessControlContext } from "../../context/DashboardContext";
import AdminCourses from "./Admin/AdminCourses";
import StudentCourses from "./Public/StudentCourses";

export default function CoursesPage() {
  const { role, initialized } = useAccessControlContext();

  if (!initialized) {
    return <div className="p-6">Đang tải quyền...</div>;
  }

  switch (role) {
    case "admin":
    case "instructor":
      return <AdminCourses />;

    case "student":
      return <StudentCourses />;

    default:
      return <div className="p-6">Không có quyền truy cập</div>;
  }
}
