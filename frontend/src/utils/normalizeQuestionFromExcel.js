export const normalizeQuestionFromExcel = (row) => {
  if (!row) return null;

  const r = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
  );

  const content = r.content?.toString().trim();
  const quizTitle = r.quiztitle?.toString().trim();

  if (!content || !quizTitle) return null;

  const type = r.type?.toString().toLowerCase().trim();

  return {
    quizTitle,

    type: ["multiple_choice", "true_false", "short_answer", "coding"].includes(
      type
    )
      ? type
      : "multiple_choice",

    content,

    // options format: "A|true;B|false;C|false"
    options: r.options
      ? r.options.split(";").map((opt) => {
          const [text, isCorrect] = opt.split("|");
          return {
            text: text?.trim(),
            isCorrect: isCorrect?.trim() === "true",
          };
        })
      : [],

    // correctAnswers format: "A|B|C"
    correctAnswers: r.correctanswers
      ? r.correctanswers.split("|").map((s) => s.trim())
      : [],

    explanation: r.explanation?.toString().trim() || "",

    difficulty: ["easy", "medium", "hard"].includes(
      r.difficulty?.toString().toLowerCase()
    )
      ? r.difficulty.toLowerCase()
      : "medium",

    tags: r.tags ? r.tags.split("|").map((t) => t.trim()) : [],

    points: Number(r.points || 1),
  };
};
