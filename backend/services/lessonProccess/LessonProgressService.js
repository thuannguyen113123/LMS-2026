import { LESSON_PROGRESS_CODES } from "../../constants/lessonProgress.js";
import { QUIZ_ATTEMPT_CODES } from "../../constants/quizAttempt.codes.js";
import LessonProgress from "../../models/lessonProgress/lessonProgress.model.js";
import Instructor from "../../models/instructor/instructor.model.js";
import Course from "../../models/courses/Course.js";
import Student from "../../models/student/student.model.js";
import Lesson from "../../models/lesson/lesson.model.js";

import Quiz from "../../models/quiz/quiz.model.js";
import AppError from "../../utils/AppError.js";

export const mapLessonProgress = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    studentId: doc.student?.toString(),
    courseId: doc.course?.toString(),
    lessonId: doc.lesson?.toString(),

    lessonType: doc.lessonType,

    status: doc.status,

    progress: {
      percent: doc.progress?.percent ?? 0,
      currentTime: doc.progress?.currentTime ?? 0,
      duration: doc.progress?.duration ?? 0,
    },

    quiz: {
      hasQuiz: doc.quiz?.hasQuiz ?? false,
      attempted: doc.quiz?.attempted ?? false,
      passed: doc.quiz?.passed ?? false,
      score: doc.quiz?.score ?? null,
      maxScore: doc.quiz?.maxScore ?? null,
      attempts: doc.quiz?.attempts ?? 0,
      maxAttempts: doc.quiz?.maxAttempts ?? 1,
      lastSubmittedAt: doc.quiz?.lastSubmittedAt ?? null,
    },

    lastAccessedAt: doc.lastAccessedAt ?? null,
    completedAt: doc.completedAt ?? null,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export const mapLessonProgressManager = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  console.log(doc);

  return {
    id: doc._id || doc.id,

    courseId: doc.course?._id,
    courseTitle: doc.course?.title || "—",

    lessonId: doc.lesson?._id,
    lessonTitle: doc.lesson?.title || "—",
    lessonType: doc.lessonType,
    studentName: doc.student?.user?.fullname || "—",
    status: doc.status,

    percent: doc.progress?.percent ?? 0,
    duration: doc.progress?.duration ?? 0,

    updatedAt: doc.updatedAt,
  };
};
export async function buildProgressFilter({ query, role, userId }) {
  const filter = {};

  // =========================
  // ROLE
  // =========================

  if (role === "instructor") {
    const instructor = await Instructor.findOne({ user: userId }).lean();

    if (!instructor) {
      filter._id = null;
      return filter;
    }

    const courses = await Course.find({
      instructor: instructor._id,
    }).select("_id");

    filter.course = {
      $in: courses.map((c) => c._id),
    };
  }

  if (role === "student") {
    const student = await Student.findOne({ user: userId }).lean();

    if (student) {
      filter.student = student._id;
    }
  }

  // =========================
  // COURSE
  // =========================

  if (query.course) {
    const course = await Course.findOne({
      slug: query.course,
    }).lean();

    if (course) {
      filter.course = course._id;
    }
  }

  // =========================
  // LESSON
  // =========================

  if (query.lesson) {
    const lesson = await Lesson.findOne({
      slug: query.lesson,
    }).lean();

    if (lesson) {
      filter.lesson = lesson._id;
    }
  }

  // =========================
  // STATUS
  // =========================

  if (query.status) {
    filter.status = query.status;
  }

  return filter;
}
export function buildProgressSort({ sort }) {
  switch (sort) {
    case "latest":
      return { updatedAt: -1 };

    case "oldest":
      return { updatedAt: 1 };

    case "progress_desc":
      return { "progress.percent": -1 };

    case "progress_asc":
      return { "progress.percent": 1 };

    default:
      return { updatedAt: -1 };
  }
}

const LessonProgressService = {
  /* =====================================================
     GET OR CREATE PROGRESS (khi mở bài học)
  ===================================================== */
  async getOrCreate({ student, course, lesson, lessonType }) {
    const hasQuiz = await Quiz.exists({
      lesson,
      isPublished: true,
    });

    const progress = await LessonProgress.findOneAndUpdate(
      { student, lesson },
      {
        $setOnInsert: {
          student,
          course,
          lesson,
          lessonType,
          quiz: {
            hasQuiz: !!hasQuiz,
          },
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return mapLessonProgress(progress);
  },
  async assertCanDoQuiz({ student, lesson }) {
    const progress = await LessonProgress.findOne({ student, lesson }).lean();

    if (!progress) {
      throw new AppError(
        QUIZ_ATTEMPT_CODES.QUIZ_ATTEMPT_LESSON_NOT_FOUND,
        "Chưa có tiến độ bài học",
        404
      );
    }

    if (progress.status === "locked") {
      throw new AppError(
        QUIZ_ATTEMPT_CODES.QUIZ_ATTEMPT_LESSON_LOCKED,
        "Bài học đang bị khóa",
        403
      );
    }

    if (!progress.quiz?.hasQuiz) {
      throw new AppError(
        QUIZ_ATTEMPT_CODES.QUIZ_ATTEMPT_NO_QUIZ,
        "Bài học này không có quiz",
        400
      );
    }

    if (progress.progress.percent < 80) {
      throw new AppError(
        QUIZ_ATTEMPT_CODES.QUIZ_ATTEMPT_NOT_ENOUGH_PROGRESS,
        "Bạn chưa hoàn thành nội dung bài học",
        400
      );
    }

    if (progress.quiz.passed) {
      return {
        ...progress,
        canReview: true,
        reviewAttemptId: progress.quiz.lastAttemptId || null,
      };
    }
    if (progress.quiz.attempts >= progress.quiz.maxAttempts) {
      throw new AppError(
        QUIZ_ATTEMPT_CODES.QUIZ_ATTEMPT_OUT_OF_ATTEMPTS,
        "Bạn đã hết lượt làm quiz",
        400
      );
    }

    return progress;
  },
  async applyQuizResult({ student, lesson, quizResult, attemptId }) {
    const progress = await LessonProgress.findOne({ student, lesson });
    if (!progress) return null;

    progress.quiz.attempted = true;
    progress.quiz.passed = quizResult.passed;
    progress.quiz.score = quizResult.score;
    progress.quiz.maxScore = quizResult.maxScore;
    progress.quiz.attempts += 1;
    progress.quiz.lastSubmittedAt = new Date();
    progress.quiz.lastAttemptId = attemptId;

    await progress.save(); // pre-save tự xử lý status
    return mapLessonProgress(progress);
  },

  async getByCourse({ student, course }) {
    if (!course) {
      throw new AppError(
        LESSON_PROGRESS_CODES.LESSON_PROGRESS_FAILED,
        "Course không hợp lệ",
        400
      );
    }

    const docs = await LessonProgress.find({
      student,
      course,
    })
      .sort({ createdAt: 1 })
      .lean();

    return docs.map(mapLessonProgress);
  },

  async updateWatching({ student, lesson, currentTime, duration }) {
    let percent =
      duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

    if (percent >= 80) {
      percent = 100;
    }

    const progress = await LessonProgress.findOne({ student, lesson });

    if (!progress) {
      throw new AppError(
        LESSON_PROGRESS_CODES.LESSON_PROGRESS_NOT_FOUND,
        "Không tìm thấy tiến độ bài học",
        404
      );
    }

    progress.progress.currentTime = currentTime;
    progress.progress.duration = duration;
    progress.progress.percent = percent;
    progress.lastAccessedAt = new Date();

    if (percent === 100 && !progress.completedAt) {
      progress.completedAt = new Date();
    }

    await progress.save(); // ✅ chạy pre-save

    return mapLessonProgress(progress);
  },

  /* =====================================================
     COMPLETE LESSON (MANUAL / AUTO)
  ===================================================== */
  async completeLesson({ student, lesson }) {
    const progress = await LessonProgress.findOne({ student, lesson });
    if (!progress) return null;

    progress.progress.percent = 100;

    // ❗ KHÔNG SET status
    await progress.save();

    return mapLessonProgress(progress);
  },

  /* =====================================================
     SUBMIT QUIZ
  ===================================================== */
  async submitQuiz({ student, lessonId, score, passScore = 0 }) {
    const progress = await LessonProgress.findOne({
      student,
      lesson: lessonId,
    });
    if (!progress) return null;

    const passed = score >= passScore;

    progress.quiz.attempted = true;
    progress.quiz.passed = passed;
    progress.quiz.score = score;
    progress.quiz.attempts += 1;
    progress.quiz.lastSubmittedAt = new Date();

    await progress.save(); // 👈 để pre-save xử lý status

    return mapLessonProgress(progress);
  },

  async listProgressUseCase({ query, role, userId }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = await buildProgressFilter({
      query,
      role,
      userId,
    });

    const sort = buildProgressSort({
      sort: query.sort,
    });

    const [rows, total] = await Promise.all([
      LessonProgress.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: "student",
          populate: {
            path: "user",
            select: "fullname",
          },
        })
        .populate("course", "title slug")
        .populate("lesson", "title slug")
        .lean(),

      LessonProgress.countDocuments(filter),
    ]);

    return {
      data: rows.map(mapLessonProgressManager),

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
  async getProgressDetailUseCase({ progressId }) {
    const progress = await LessonProgress.findById(progressId)
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "fullname email",
        },
      })
      .populate("course", "title slug")
      .lean();

    if (!progress) {
      throw new AppError(
        LESSON_PROGRESS_CODES.LESSON_PROGRESS_NOT_FOUND,
        "Không tìm thấy tiến độ",
        404
      );
    }

    const lessons = await LessonProgress.find({
      student: progress.student._id,
      course: progress.course._id,
    })
      .populate("lesson", "title slug order")
      .sort({ "lesson.order": 1 })
      .lean();

    const totalLessons = lessons.length;

    const completedLessons = lessons.filter(
      (l) => l.status === "completed"
    ).length;

    const percent =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      student: {
        id: progress.student._id,
        name: progress.student.user.fullname,
        email: progress.student.user.email,
      },

      course: {
        id: progress.course._id,
        title: progress.course.title,
      },

      progress: {
        percent,
        totalLessons,
        completedLessons,
      },

      lessons: lessons.map((l) => ({
        id: l.lesson._id,
        title: l.lesson.title,
        status: l.status,
        percent: l.progress?.percent ?? 0,
      })),
    };
  },
  async resetProgressUseCase({ progressId }) {
    const progress = await LessonProgress.findById(progressId);

    if (!progress) {
      throw new AppError(
        LESSON_PROGRESS_CODES.LESSON_PROGRESS_NOT_FOUND,
        "Không tìm thấy tiến độ bài học",
        404
      );
    }

    progress.status = "not_started";

    progress.progress = {
      percent: 0,
      currentTime: 0,
      duration: progress.progress?.duration || 0,
    };

    progress.quiz = {
      ...progress.quiz,
      attempted: false,
      passed: false,
      score: null,
      attempts: 0,
      lastSubmittedAt: null,
    };

    progress.lastAccessedAt = null;
    progress.completedAt = null;

    await progress.save();

    return mapLessonProgress(progress);
  },
};

export default LessonProgressService;
