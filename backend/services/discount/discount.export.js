import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const DISCOUNT_EXPORT_COLUMNS = [
  { header: "Code", key: "code" },
  { header: "Loại", key: "type" },
  { header: "Giá trị", key: "value" },
  { header: "Đơn tối thiểu", key: "minOrderValue" },
  { header: "Giảm tối đa", key: "maxDiscountAmount" },
  { header: "Áp dụng cho", key: "applicableTo" },
  { header: "Giới hạn sử dụng", key: "usageLimit" },
  { header: "Đã sử dụng", key: "usedCount" },
  { header: "Trạng thái", key: "isActive" },
  { header: "Ngày bắt đầu", key: "startDate" },
  { header: "Ngày kết thúc", key: "endDate" },
  { header: "Người tạo", key: "createdBy" },
];
export function mapDiscountExportData(discounts = []) {
  return discounts.map((d) => ({
    code: d.code,
    type: d.type === "percentage" ? "Phần trăm" : "Giá cố định",
    value: d.value,
    minOrderValue: d.minOrderValue,
    maxDiscountAmount: d.maxDiscountAmount,
    applicableTo: d.applicableTo,
    usageLimit: d.usageLimit || "Không giới hạn",
    usedCount: d.usedCount,
    isActive: d.isActive ? "Hoạt động" : "Ngưng",
    startDate: new Date(d.startDate).toLocaleString(),
    endDate: new Date(d.endDate).toLocaleString(),
    createdBy: d.createdBy?.fullname || "",
  }));
}
export async function exportDiscountsFile({ discounts, format }) {
  const data = mapDiscountExportData(discounts);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Discounts",
      columns: DISCOUNT_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách mã giảm giá",
    columns: DISCOUNT_EXPORT_COLUMNS,
    data,
  });
}
