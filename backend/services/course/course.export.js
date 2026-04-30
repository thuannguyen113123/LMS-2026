import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const COURSE_EXPORT_COLUMNS = [
  { header: "Tiêu đề", key: "title" },
  { header: "Slug", key: "slug" },
  { header: "Danh mục", key: "category" },
  { header: "Giảng viên", key: "instructor" },
  { header: "Giá", key: "price" },
  { header: "Miễn phí", key: "isFree" },
  { header: "Trạng thái", key: "status" },
  { header: "Rating", key: "rating" },
  { header: "Ngày tạo", key: "createdAt" },
];
export function mapCourseExportData(courses = []) {
  return courses.map((c) => ({
    title: c.title,
    slug: c.slug,
    category: c.category?.name || "",
    instructor: c.instructor?.fullname || "",
    price: c.price,
    isFree: c.isFree ? "Yes" : "No",
    status: c.status,
    rating: c.rating,
    createdAt: new Date(c.createdAt).toLocaleString(),
  }));
}
export async function exportCoursesFile({ courses, format }) {
  const data = mapCourseExportData(courses);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Courses",
      columns: COURSE_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách khóa học",
    columns: COURSE_EXPORT_COLUMNS,
    data,
  });
}
