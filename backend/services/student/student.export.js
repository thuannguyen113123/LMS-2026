import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const STUDENT_EXPORT_COLUMNS = [
  { header: "Slug", key: "slug" },
  { header: "Họ tên", key: "fullname" },
  { header: "Email", key: "email" },
  { header: "SĐT", key: "phone" },
  { header: "Số lượng khóa học ghi danh", key: "enrolledCourses" },

  { header: "Trạng thái", key: "status" },
  { header: "Ngày tạo", key: "createdAt" },
];

export function mapStudentExportData(students = []) {
  console.log(students, "students");

  return students.map((s) => {
    const user = s.user || {};

    return {
      slug: s.slug || "",
      fullname: user.fullname || "",
      email: user.email || "",
      phone: user.phone || "",
      status: s.status || "",
      enrolledCourses: s.enrolledCourses.length || 0,

      createdAt: s.createdAt
        ? new Date(s.createdAt).toLocaleString("vi-VN")
        : "",
    };
  });
}

export async function exportStudentsFile({ students, format }) {
  const data = mapStudentExportData(students);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Students",
      columns: STUDENT_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách học sinh",
    columns: STUDENT_EXPORT_COLUMNS,
    data,
  });
}
