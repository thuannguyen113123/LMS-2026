import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const COMMENT_EXPORT_COLUMNS = [
  { header: "Nội dung", key: "content" },
  { header: "Tác giả", key: "author" },
  { header: "Target type", key: "targetType" },
  { header: "Likes", key: "like_count" },
  { header: "Reports", key: "report_count" },
  { header: "Ngày tạo", key: "createdAt" },
];
export function mapCommentExportData(comments = []) {
  return comments.map((c) => ({
    content: c.content,
    author: c.authorId?.fullname || "",
    targetType: c.targetType,
    like_count: c.like_count,
    report_count: c.report_count,
    createdAt: new Date(c.createdAt).toLocaleString(),
  }));
}

export async function exportCommentsFile({ comments, format }) {
  const data = mapCommentExportData(comments);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Comments",
      columns: COMMENT_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách bình luận",
    columns: COMMENT_EXPORT_COLUMNS,
    data,
  });
}
