import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const LESSON_EXPORT_COLUMNS = [
  { header: "Tiêu đề", key: "title" },
  { header: "Slug", key: "slug" },
  { header: "Khóa học", key: "course" },
  { header: "Thứ tự", key: "order" },
  { header: "Thời lượng", key: "duration" },
  { header: "Xuất bản", key: "isPublished" },
  { header: "Ngày tạo", key: "createdAt" },
];

export function mapLessonExportData(lessons = []) {
  return lessons.map((l) => ({
    title: l.title,
    slug: l.slug,
    course: l.course?.title || "",
    order: l.order,
    duration: l.duration,
    isPublished: l.isPublished ? "Yes" : "No",
    createdAt: new Date(l.createdAt).toLocaleString(),
  }));
}

export async function exportLessonsFile({ lessons, format }) {
  const data = mapLessonExportData(lessons);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Lessons",
      columns: LESSON_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách bài học",
    columns: LESSON_EXPORT_COLUMNS,
    data,
  });
}
