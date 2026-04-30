import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

/* =======================
   EXPORT COLUMNS
======================= */
export const PERMISSION_EXPORT_COLUMNS = [
  { header: "Tên quyền", key: "name" },
  { header: "Mã quyền", key: "code" },
  { header: "Module", key: "module" },
  { header: "Danh mục", key: "category" },
  { header: "System permission", key: "isSystemPermission" },
  { header: "Mô tả", key: "description" },
  { header: "Ngày tạo", key: "createdAt" },
];

/* =======================
   MAP DATA
======================= */
export function mapPermissionExportData(permissions = []) {
  console.log(permissions);

  return permissions.map((p) => ({
    name: p.name,
    code: p.code,
    module: p.module || "",
    category: p.category,
    isSystemPermission: p.isSystemPermission ? "Yes" : "No",
    description: p.description || "",
    createdAt: new Date(p.createdAt).toLocaleString(),
  }));
}

/* =======================
   EXPORT HANDLER
======================= */
export async function exportPermissions({ permissions, format }) {
  const data = mapPermissionExportData(permissions);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Permissions",
      columns: PERMISSION_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách Permissions",
    columns: PERMISSION_EXPORT_COLUMNS,
    data,
  });
}
