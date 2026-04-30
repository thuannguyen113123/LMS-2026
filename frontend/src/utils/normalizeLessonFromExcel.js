export const normalizeLessonFromExcel = (row) => {
  if (!row?.title?.trim()) return null;

  return {
    title: row.title.trim(),

    content: row.content?.trim() || "",
    videoUrl: row.videoUrl?.trim() || "",

    duration: Number(row.duration) || 0,
    order: Number(row.order) || 1,

    isPublished:
      row.isPublished === true ||
      row.isPublished === "true" ||
      row.isPublished === 1,

    courseSlug: row.courseSlug?.trim() || null,
  };
};
