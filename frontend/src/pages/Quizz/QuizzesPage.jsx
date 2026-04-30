import { useAccessControlContext } from "../../context/DashboardContext";
import AdminQuizzes from "./Admin/AdminQuizzes";
import StudentQuizzes from "./Public/StudentQuizzes";

export default function QuizzesPage() {
  const { role } = useAccessControlContext();

  switch (role) {
    case "admin":
    case "instructor":
      return <AdminQuizzes />;

    case "student":
      return <StudentQuizzes />;

    default:
      return null;
  }
}
