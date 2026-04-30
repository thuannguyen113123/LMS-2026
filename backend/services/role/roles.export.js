import { exportExcel } from "../../services/export/excel.service.js";
import { exportPDF } from "../../services/export/pdf.service.js";

export const ROLE_EXPORT_COLUMNS = [
  { header: "Tên role", key: "name" },
  { header: "Mô tả", key: "description" },
  { header: "System role", key: "isSystemRole" },
  { header: "Ngày tạo", key: "createdAt" },
];

export function mapRoleExportData(roles = []) {
  return roles.map((r) => ({
    name: r.name,
    description: r.description || "",
    isSystemRole: r.isSystemRole ? "Yes" : "No",
    createdAt: new Date(r.createdAt).toLocaleString("vi-VN"),
  }));
}

export async function exportRoles({ roles, format }) {
  const data = mapRoleExportData(roles);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Roles",
      columns: ROLE_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách Roles",
    columns: ROLE_EXPORT_COLUMNS,
    data,
  });
}
