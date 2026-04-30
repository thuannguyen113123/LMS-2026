import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

/* =======================
   EXPORT COLUMNS
======================= */

export const USER_EXPORT_COLUMNS = [
  { header: "Họ tên", key: "fullname" },
  { header: "Email", key: "email" },
  { header: "Điện thoại", key: "phone" },
  { header: "Role", key: "role" }, // FK → name
  { header: "Provider", key: "provider" },
  { header: "Active", key: "isActive" },
  { header: "Verified", key: "verified" },
  { header: "Locked", key: "locked" },
  { header: "Online", key: "isOnline" },
  { header: "Ngày tạo", key: "createdAt" },
  { header: "Last login", key: "lastLogin" },
];

/* =======================
   MAP DATA
======================= */

export function mapUserExportData(users = []) {
  return users.map((u) => ({
    fullname: u.fullname || "",
    email: u.email || "",
    phone: u.phone || "",
    role: u.role?.name || "",
    provider: u.provider,
    isActive: u.isActive ? "Yes" : "No",
    verified: u.verified ? "Yes" : "No",
    locked: u.locked ? "Yes" : "No",
    isOnline: u.isOnline ? "Yes" : "No",
    createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString() : "",
    lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "",
  }));
}

/* =======================
   EXPORT HANDLER
======================= */

export async function exportUsersFile({ users, format }) {
  const data = mapUserExportData(users);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Users",
      columns: USER_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách Users",
    columns: USER_EXPORT_COLUMNS,
    data,
  });
}
