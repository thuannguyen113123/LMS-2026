import StudentQuizAttempt from "../../models/StudentQuizAttempt/StudentQuizAttempt.model.js";

import StudentAnswerServices from "../../services/studentAnswer/studentAnswer.services.js";
import StudentAnswer from "../../models/quiz/StudentAnswer.model.js";
import Student from "../../models/student/student.model.js";
import Instructor from "../../models/instructor/instructor.model.js";

import Quiz from "../../models/quiz/quiz.model.js";
import LessonProgressService from "../../services/lessonProccess/LessonProgressService.js";
import { QUIZ_ATTEMPT_CODES } from "../../constants/quizAttempt.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import AppError from "../../utils/AppError.js";

export const mapStudentQuizAttempt = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    student: doc.student && {
      id: doc.student._id?.toString(),
      fullname: doc.student.user?.fullname,
      email: doc.student.user?.email,
      avatar: doc.student.user?.avatar,
    },

    quiz: doc.quiz && {
      id: doc.quiz._id?.toString(),
      title: doc.quiz.title,
      slug: doc.quiz.slug,
      timeLimit: doc.quiz?.timeLimit ?? null,
    },

    course: doc.quiz?.course && {
      id: doc.quiz.course._id?.toString(),
      title: doc.quiz.course.title,
      slug: doc.quiz.course.slug,
    },

    score: doc.score ?? 0,
    duration: doc.duration ?? 0,

    startTime: doc.startTime,
    endTime: doc.endTime ?? null,

    status: doc.status,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export function mapStudentAnswer(doc) {
  return {
    id: doc._id.toString(),
    submittedAt: doc.submittedAt,
    selectedOptions: doc.selectedOptions,
    isCorrect: doc.isCorrect,
    autoGraded: doc.autoGraded,
    aiFeedback: doc.aiFeedback,

    question: {
      id: doc.question?._id?.toString(),
      content: doc.question?.content,
      type: doc.question?.type,
      options: doc.question?.options,
      correctAnswers: doc.question?.correctAnswers,
      explanation: doc.question?.explanation,
      difficulty: doc.question?.difficulty,
      points: doc.question?.points,
    },
  };
}
export async function buildAttemptFilter({ query, role, userId }) {
  const filter = {};

  // ===== ROLE =====

  if (role === "student") {
    const student = await Student.findOne({ user: userId }).lean();

    if (student) {
      filter.student = student._id;
    } else {
      filter._id = null;
    }
  }

  if (role === "instructor") {
    const instructor = await Instructor.findOne({ user: userId }).lean();

    if (!instructor) {
      filter._id = null;
      return filter;
    }

    const quizzes = await Quiz.find({
      createdBy: instructor._id,
    }).select("_id");

    const quizIds = quizzes.map((q) => q._id);

    filter.quiz = { $in: quizIds };
  }

  // ===== FILTER BY STUDENT =====

  if (query.student) {
    filter.student = query.student;
  }

  // ===== FILTER BY QUIZ =====

  if (query.quiz) {
    filter.quiz = query.quiz;
  }

  if (query.quizSlug) {
    const quiz = await Quiz.findOne({ slug: query.quizSlug }).lean();
    if (quiz) filter.quiz = quiz._id;
  }

  // ===== FILTER BY COURSE =====

  if (query.courseSlug) {
    const course = await Course.findOne({ slug: query.courseSlug }).lean();

    if (course) {
      const quizzes = await Quiz.find({ course: course._id }).select("_id");

      filter.quiz = {
        $in: quizzes.map((q) => q._id),
      };
    }
  }

  // ===== STATUS =====

  if (query.status) {
    const statuses = Array.isArray(query.status)
      ? query.status
      : [query.status];

    filter.status = { $in: statuses };
  }

  // ===== DATE RANGE =====

  if (query.fromDate || query.toDate) {
    filter.createdAt = {};

    if (query.fromDate) {
      filter.createdAt.$gte = new Date(query.fromDate);
    }

    if (query.toDate) {
      filter.createdAt.$lte = new Date(query.toDate);
    }
  }

  // ===== SEARCH =====

  if (query.search?.trim()) {
    const students = await Student.find()
      .populate({
        path: "user",
        match: {
          fullname: { $regex: query.search, $options: "i" },
        },
      })
      .lean();

    const studentIds = students.filter((s) => s.user).map((s) => s._id);

    if (studentIds.length > 0) {
      filter.student = { $in: studentIds };
    }
  }

  return filter;
}
export function buildAttemptSort({ sort }) {
  switch (sort) {
    case "score_desc":
      return { score: -1, _id: -1 };

    case "score_asc":
      return { score: 1, _id: 1 };

    case "latest":
      return { createdAt: -1, _id: -1 };

    case "oldest":
      return { createdAt: 1, _id: 1 };

    default:
      return { createdAt: -1, _id: -1 };
  }
}

const StudentQuizAttemptService = {
  //--------------------------------------------------
  // ⭐ Tạo attempt mới
  //--------------------------------------------------
  async createAttempt(data) {
    const doc = await StudentQuizAttempt.create(data);
    return doc.toObject();
  },

  //--------------------------------------------------
  // ⭐ Lấy attempt theo ID
  //--------------------------------------------------
  async getById(id) {
    return await StudentQuizAttempt.findById(id)
      .populate("quiz")
      .populate("student")
      .populate({ path: "answers", populate: { path: "question" } })
      .lean();
  },

  //--------------------------------------------------
  // ⭐ Kiểm tra attempt đang làm
  //--------------------------------------------------
  async getInProgress(quiz, student) {
    return await StudentQuizAttempt.findOne({
      quiz,
      student,
      status: "in_progress",
    }).lean();
  },

  async submitAttempt({ attemptId, student, answers }) {
    const attempt = await StudentQuizAttempt.findOneAndUpdate(
      {
        _id: attemptId,
        student,
        status: "in_progress",
      },
      {
        $set: {
          status: "grading", // 🔥 LOCK NGAY
        },
      },
      { new: true }
    ).populate("quiz");
    if (!attempt) return null;

    // 1️⃣ chấm điểm
    const result = await StudentAnswerServices.grade(
      attempt.quiz,
      answers,
      student
    );

    // 2️⃣ update attempt
    attempt.answers = result.answerIds;
    attempt.score = result.score;
    attempt.maxScore = result.maxScore;
    attempt.passed = result.passed;
    attempt.status = "completed";
    attempt.endTime = new Date();
    attempt.duration =
      (attempt.endTime.getTime() - attempt.startTime.getTime()) / 1000;

    await attempt.save();

    // 3️⃣ update lesson progress
    if (attempt.quiz.scope === "lesson" && attempt.quiz.lesson) {
      await LessonProgressService.applyQuizResult({
        student,
        lesson: attempt.quiz.lesson,
        quizResult: result,
        attemptId: attempt._id,
      });
    }

    return attempt;
  },

  async assertNoInProgress({ quiz, student }) {
    const exist = await StudentQuizAttempt.findOne({
      quiz,
      student,
      status: "in_progress",
    }).lean();

    if (exist) {
      throw new AppError(
        QUIZ_ATTEMPT_CODES.QUIZ_ATTEMPT_IN_PROGRESS_EXISTS,
        "Bạn đang có bài quiz chưa hoàn thành",
        400
      );
    }

    return true;
  },

  async listAttemptsUseCase({ query, role, userId }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = await buildAttemptFilter({
      query,
      role,
      userId,
    });

    const sort = buildAttemptSort({
      sort: query.sort,
    });

    const [attempts, total] = await Promise.all([
      StudentQuizAttempt.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: "quiz",
          select: "title slug course",
          populate: {
            path: "course",
            select: "title slug",
          },
        })
        .populate({
          path: "student",
          populate: {
            path: "user",
            select: "fullname email avatar",
          },
        })
        .lean(),

      StudentQuizAttempt.countDocuments(filter),
    ]);

    return {
      data: attempts.map(mapStudentQuizAttempt),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },
  async getAttemptDetailUseCase({ attemptId, role, userId }) {
    const attempt = await StudentQuizAttempt.findById(attemptId)
      .populate({
        path: "quiz",
        select: "title slug course timeLimit",
        populate: {
          path: "course",
          select: "title slug",
        },
      })
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "fullname avatar",
        },
      })
      .lean();

    if (!attempt) {
      throw new AppError("Attempt not found", 404);
    }

    // ===== ROLE GUARD =====

    if (role === "student") {
      const student = await Student.findOne({ user: userId }).lean();

      if (!student || String(student._id) !== String(attempt.student._id)) {
        throw new AppError("Forbidden", 403);
      }
    }

    return mapStudentQuizAttempt(attempt);
  },
  async listAttemptAnswersUseCase({ attemptId, query, role, userId }) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor;

    const attempt = await StudentQuizAttempt.findById(attemptId)
      .select("answers")
      .lean();

    if (!attempt) {
      throw new AppError("Attempt not found", 404);
    }

    const filter = {
      _id: { $in: attempt.answers },
    };
    if (role === "student") {
      const student = await Student.findOne({ user: userId }).lean();

      if (!student || String(student._id) !== String(attempt.student)) {
        throw new AppError("Forbidden", 403);
      }
    }
    // ===== CURSOR =====
    if (cursor) {
      const cursorDoc = await StudentAnswer.findById(cursor)
        .select("createdAt")
        .lean();

      if (!cursorDoc) {
        throw new AppError("Invalid cursor", 400);
      }

      filter.$or = [
        { createdAt: { $lt: cursorDoc.createdAt } },
        {
          createdAt: cursorDoc.createdAt,
          _id: { $lt: cursor },
        },
      ];
    }

    const docs = await StudentAnswer.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: "question",
        select: "content type options correctAnswers explanation",
      })
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map(mapStudentAnswer);

    return {
      data,
      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },

  async deleteOne(id) {
    const doc = await StudentQuizAttempt.findById(id);
    if (!doc) return null;

    await StudentQuizAttempt.findByIdAndDelete(id);
    return doc.toObject();
  },

  async deleteMany(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) return false;
    const docs = await StudentQuizAttempt.find({ _id: { $in: ids } }).lean();
    await StudentQuizAttempt.deleteMany({ _id: { $in: ids } });
    return docs;
  },
  async startAttempt({ quizId, lessonId, student }) {
    // 1. check lesson rule
    const progress = await LessonProgressService.assertCanDoQuiz({
      student,
      lesson: lessonId,
    });
    if (progress?.canReview) {
      return {
        reviewMode: true,
        attemptId: progress.reviewAttemptId,
      };
    }

    // 2. check in-progress
    await this.assertNoInProgress({
      quiz: quizId,
      student,
    });

    // 3. create
    const created = await StudentQuizAttempt.create({
      quiz: quizId,
      student,
      lesson: lessonId,
    });

    const mapped = mapStudentQuizAttempt(created);

    // 4. audit log
    await saveAuditLogs({
      entityType: "student_quiz_attempts",
      entityId: mapped.id,
      action: "create",
      oldData: {},
      newData: mapped,
      updatedBy: student.id,
    });

    return mapped;
  },
};

export default StudentQuizAttemptService;
