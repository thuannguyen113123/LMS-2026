import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";
import { mapModule } from "./module.services.js";

export const MODULE_EXPORT_COLUMNS = [
  { header: "Tên module", key: "name" },
  { header: "Code", key: "code" },
  { header: "Slug", key: "slug" },
  { header: "Path", key: "path" },
  { header: "Icon", key: "icon" },
  { header: "Order", key: "order" },
  { header: "Active", key: "isActive" },
  { header: "Group", key: "group" },
  { header: "System", key: "isSystemModule" },
  { header: "Mô tả", key: "description" },
  { header: "Ngày tạo", key: "createdAt" },
];

export function mapModuleExportData(modules = []) {
  return modules.map((mRaw) => {
    const m = mapModule(mRaw);

    return {
      name: m.name,
      code: m.code,
      slug: m.slug,
      path: m.path || "",
      icon: m.icon || "",
      order: m.order ?? 0,
      group: m.group || "main", // ✅ thêm dòng này
      isActive: m.isActive ? "Yes" : "No",
      isSystemModule: m.isSystemModule ? "Yes" : "No",
      description: m.description || "",
      createdAt: new Date(m.createdAt).toLocaleString(),
    };
  });
}

export async function exportModulesFile({ modules, format }) {
  const data = mapModuleExportData(modules);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Modules",
      columns: MODULE_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách Modules",
    columns: MODULE_EXPORT_COLUMNS,
    data,
  });
}
