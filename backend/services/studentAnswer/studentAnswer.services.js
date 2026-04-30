import Question from "../../models/quiz/question.model.js";
import StudentAnswer from "../../models/quiz/StudentAnswer.model.js";
const StudentAnswerServices = {
  async grade(quiz, answers, student) {
    let score = 0;
    let maxScore = 0;

    const savedAnswers = [];

    // load questions
    const questions = await Question.find({
      _id: { $in: answers.map((a) => a.question) },
    });

    const questionMap = new Map();
    questions.forEach((q) => questionMap.set(String(q._id), q));

    for (const answer of answers) {
      const question = questionMap.get(answer.question);
      if (!question) continue;

      maxScore += question.points;

      let isCorrect = false;
      let autoGraded = true;

      switch (question.type) {
        case "multiple_choice":
        case "true_false":
          isCorrect =
            JSON.stringify(answer.selectedOptions.sort()) ===
            JSON.stringify(question.correctAnswers.sort());
          break;

        case "short_answer":
          isCorrect = question.correctAnswers.some((a) =>
            answer.selectedOptions[0]?.toLowerCase().includes(a.toLowerCase())
          );
          break;

        case "coding":
          autoGraded = false;
          break;
      }

      if (isCorrect) score += question.points;

      const studentAnswer = await StudentAnswer.create({
        student,
        question: question._id,
        selectedOptions: answer.selectedOptions,
        isCorrect,
        autoGraded,
      });

      savedAnswers.push(studentAnswer._id);
    }

    return {
      score,
      maxScore,
      passed: quiz.passingScore
        ? (score / maxScore) * 100 >= quiz.passingScore
        : true,
      answerIds: savedAnswers,
    };
  },
};
export default StudentAnswerServices;
