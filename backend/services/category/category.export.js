import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const CATEGORY_EXPORT_COLUMNS = [
  { header: "Tên danh mục", key: "name" },
  { header: "Slug", key: "slug" },
  { header: "Trạng thái", key: "status" },
  { header: "Mô tả", key: "description" },
  { header: "Ngày tạo", key: "createdAt" },
];

export function mapCategoryExportData(categories = []) {
  return categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    status: c.status === "active" ? "Hoạt động" : "Không hoạt động",
    description: c.description || "",
    createdAt: new Date(c.createdAt).toLocaleString(),
  }));
}

export async function exportCategories({ categories, format }) {
  const data = mapCategoryExportData(categories);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Categories",
      columns: CATEGORY_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách Danh mục",
    columns: CATEGORY_EXPORT_COLUMNS,
    data,
  });
}
