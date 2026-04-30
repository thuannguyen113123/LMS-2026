import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const QUIZ_EXPORT_COLUMNS = [
  { header: "Tiêu đề", key: "title" },
  { header: "Slug", key: "slug" },
  { header: "Phạm vi", key: "scope" },
  { header: "Loại", key: "type" },
  { header: "Khóa học", key: "course" },
  { header: "Bài học", key: "lesson" },
  { header: "Thời gian (phút)", key: "timeLimit" },
  { header: "Điểm đạt", key: "passingScore" },
  { header: "Số lần làm tối đa", key: "maxAttempts" },
  { header: "Trộn câu hỏi", key: "shuffleQuestions" },
  { header: "Trộn đáp án", key: "shuffleOptions" },
  { header: "Trạng thái", key: "isPublished" },
  { header: "Ngày tạo", key: "createdAt" },
];

export function mapQuizExportData(quizzes = []) {
  return quizzes.map((q) => ({
    title: q.title,
    slug: q.slug,
    scope: q.scope === "course" ? "Toàn khóa học" : "Theo bài học",
    type: q.type,
    course: q.course?.title || "",
    lesson: q.lesson?.title || "",
    timeLimit: q.timeLimit ?? "",
    passingScore: q.passingScore,
    maxAttempts: q.maxAttempts,
    shuffleQuestions: q.shuffleQuestions ? "Có" : "Không",
    shuffleOptions: q.shuffleOptions ? "Có" : "Không",
    isPublished: q.isPublished ? "Đã xuất bản" : "Bản nháp",
    createdAt: q.createdAt ? new Date(q.createdAt).toLocaleString() : "",
  }));
}

export async function exportQuizzesFile({ quizzes, format }) {
  const data = mapQuizExportData(quizzes);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Quizzes",
      columns: QUIZ_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách quiz",
    columns: QUIZ_EXPORT_COLUMNS,
    data,
  });
}
