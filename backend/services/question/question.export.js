import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const QUESTION_EXPORT_COLUMNS = [
  { header: "Nội dung", key: "content" },
  { header: "Loại", key: "type" },
  { header: "Câu trả lời", key: "correctAnswers" },
  { header: "Quiz", key: "quiz" },
  { header: "Độ khó", key: "difficulty" },
  { header: "Điểm", key: "points" },
  { header: "Tags", key: "tags" },
  { header: "Người tạo", key: "createdBy" },
  { header: "Ngày tạo", key: "createdAt" },
];

export function mapQuestionExportData(questions = []) {
  return questions.map((q) => ({
    content: q.content,
    type: q.type,
    correctAnswers: q.correctAnswers,
    quiz: q.quiz?.title || "",
    difficulty: q.difficulty,

    points: q.points,
    tags: q.tags?.join(", ") || "",
    createdBy: q.createdBy?.fullname || "",
    createdAt: new Date(q.createdAt).toLocaleString(),
  }));
}

export async function exportQuestionsFile({ questions, format }) {
  const data = mapQuestionExportData(questions);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Questions",
      columns: QUESTION_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách câu hỏi",
    columns: QUESTION_EXPORT_COLUMNS,
    data,
  });
}
