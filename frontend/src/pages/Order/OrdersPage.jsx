import { useAccessControlContext } from "../../context/DashboardContext";
import AdminOrders from "./AdminOrders";
import StudentOrders from "./StudentOrders";

export default function OrdersPage() {
  const { role } = useAccessControlContext();

  switch (role) {
    case "admin":
    case "instructor":
      return <AdminOrders />;

    case "student":
      return <StudentOrders />;

    default:
      return null;
  }
}
