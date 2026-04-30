import { LESSON_PROGRESS_CODES } from "../../constants/lessonProgress.js";
import LessonProgressService from "../../services/lessonProccess/LessonProgressService.js";
import Student from "../../models/student/student.model.js";

import AppError from "../../utils/AppError.js";

const mapDoc = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const lessonProgressController = {
  async getOrCreate(req, res) {
    try {
      const studentDoc = await Student.findOne({ user: req.user.id }).lean();

      if (!studentDoc) {
        throw new AppError("STUDENT_NOT_FOUND", "Student không tồn tại", 404);
      }

      const { courseId, lessonId, lessonType } = req.validatedBody;

      const progress = await LessonProgressService.getOrCreate({
        student: studentDoc._id,
        course: courseId,
        lesson: lessonId,
        lessonType,
      });

      return res.status(200).json({
        success: true,
        code: LESSON_PROGRESS_CODES.LESSON_PROGRESS_FETCHED,
        message: "Lấy tiến độ bài học thành công",
        data: { progress },
      });
    } catch (err) {
      console.error("getOrCreate lesson progress error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_PROGRESS_CODES.LESSON_PROGRESS_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async getByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const student = await Student.findOne({ user: req.user.id }).lean();

      const progresses = await LessonProgressService.getByCourse({
        student: student._id,
        course: courseId,
      });

      return res.status(200).json({
        success: true,
        code: LESSON_PROGRESS_CODES.LESSON_PROGRESS_FETCHED,
        message: "Lấy tiến độ khóa học thành công",
        data: { progresses },
      });
    } catch (err) {
      console.error("get lesson progress by course error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_PROGRESS_CODES.LESSON_PROGRESS_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async updateWatching(req, res) {
    try {
      const student = await Student.findOne({ user: req.user.id }).lean();

      const { lessonId, currentTime, duration } = req.validatedBody;

      const progress = await LessonProgressService.updateWatching({
        student: student._id,
        lesson: lessonId,
        currentTime,
        duration,
      });

      return res.status(200).json({
        success: true,
        code: LESSON_PROGRESS_CODES.LESSON_PROGRESS_UPDATED,
        message: "Cập nhật tiến độ xem bài học thành công",
        data: { progress },
      });
    } catch (err) {
      console.error("update watching error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_PROGRESS_CODES.LESSON_PROGRESS_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async completeLesson(req, res) {
    try {
      const student = req.user._id || req.user.id;
      const { lessonId } = req.validatedBody;

      const updated = await LessonProgressService.completeLesson({
        student,
        lesson: lessonId,
      });

      return res.json({
        success: true,
        progress: mapDoc(updated),
      });
    } catch (err) {
      console.error("complete lesson error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  async submitQuiz(req, res) {
    try {
      const student = req.user._id || req.user.id;
      const { lessonId, score, passScore } = req.validatedBody;

      const updated = await LessonProgressService.submitQuiz({
        student,
        lessonId,
        score,
        passScore,
      });

      return res.json({
        success: true,
        progress: mapDoc(updated),
      });
    } catch (err) {
      console.error("submit quiz error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await LessonProgressService.listProgressUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: LESSON_PROGRESS_CODES.PROGRESS_LIST_SUCCESS,
        message: "Lấy danh sách tiến độ học tập thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_PROGRESS_CODES.PROGRESS_LIST_FAILED,
        message: "Server error",
      });
    }
  },
  async getDetail(req, res) {
    try {
      const { id } = req.params;

      const result = await LessonProgressService.getProgressDetailUseCase({
        progressId: id,
      });

      return res.json({
        success: true,
        code: LESSON_PROGRESS_CODES.PROGRESS_DETAIL_SUCCESS,
        message: "Lấy chi tiết tiến độ học tập thành công",
        data: result,
      });
    } catch (err) {
      console.error("get progress detail error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_PROGRESS_CODES.PROGRESS_DETAIL_FAILED,
        message: "Server error",
      });
    }
  },

  async resetProgress(req, res) {
    try {
      const { id } = req.params;

      const progress = await LessonProgressService.resetProgressUseCase({
        progressId: id,
      });

      return res.json({
        success: true,
        code: LESSON_PROGRESS_CODES.LESSON_PROGRESS_RESET_SUCCESS,
        message: "Reset tiến độ bài học thành công",
        data: { progress },
      });
    } catch (err) {
      console.error("reset progress error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_PROGRESS_CODES.LESSON_PROGRESS_RESET_FAILED,
        message: "Server error",
      });
    }
  },
};
