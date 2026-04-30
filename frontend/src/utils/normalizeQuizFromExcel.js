export const normalizeQuizFromExcel = (row) => {
  if (!row) return null;

  const r = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
  );

  const title = r.title?.toString().trim();
  if (!title) return null;

  const scope = (r.scope || "course").toLowerCase();

  return {
    title,

    scope,

    type: (r.type || "quiz").toLowerCase(),

    courseSlug: r.courseslug?.toString().trim(),

    lessonSlug:
      scope === "lesson" ? r.lessonslug?.toString().trim() || null : null,

    timeLimit: r.timelimit ? Number(r.timelimit) : null,

    passingScore: Number(r.passingscore || 0),

    maxAttempts: Number(r.maxattempts || 1),

    shuffleQuestions: String(r.shufflequestions).toLowerCase() === "true",

    shuffleOptions: String(r.shuffleoptions).toLowerCase() === "true",

    isPublished: String(r.ispublished).toLowerCase() === "true",
  };
};
