import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const INSTRUCTOR_EXPORT_COLUMNS = [
  { header: "ID", key: "id" },
  { header: "Họ tên", key: "fullname" },
  { header: "Email", key: "email" },
  { header: "Số điện thoại", key: "phone" },
  { header: "Chuyên môn", key: "expertise" },
  { header: "Tổng học viên", key: "totalStudents" },
  { header: "Điểm trung bình", key: "ratingAverage" },
  { header: "Số lượt đánh giá", key: "ratingCount" },
  { header: "Ngày tạo", key: "createdAt" },
  { header: "Ngày cập nhật", key: "updatedAt" },
];

export function mapInstructorExportData(list = []) {
  return list.map((i) => ({
    id: i._id?.toString() || "",
    fullname: i.user?.fullname || "",
    email: i.user?.email || "",
    phone: i.user?.phone || "",
    expertise: Array.isArray(i.expertise) ? i.expertise.join(", ") : "",
    totalStudents: i.totalStudents || 0,
    ratingAverage: i.rating?.average || 0,
    ratingCount: i.rating?.count || 0,
    createdAt: i.createdAt ? new Date(i.createdAt).toLocaleString("vi-VN") : "",
    updatedAt: i.updatedAt ? new Date(i.updatedAt).toLocaleString("vi-VN") : "",
  }));
}
export async function exportInstructorsFile({ instructors, format }) {
  const data = mapInstructorExportData(instructors);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Instructors",
      columns: INSTRUCTOR_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách giảng viên",
    columns: INSTRUCTOR_EXPORT_COLUMNS,
    data,
  });
}
