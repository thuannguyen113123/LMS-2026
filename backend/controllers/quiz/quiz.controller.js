import mongoose from "mongoose";
import Quiz from "../../models/quiz/quiz.model.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import { quizSchema } from "../../validators/quiz/quiz.validator.js";
import QuizService from "../../services/quiz/quiz.services.js";
import Course from "../../models/courses/Course.js";
import { QUIZ_CODES } from "../../constants/quiz.codes.js";
import AppError from "../../utils/AppError.js";

export function getUserIdentifier(user) {
  return user?._id || user?.id || null;
}

const mapDoc = (doc) => {
  if (doc.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const quizController = {
  async create(req, res) {
    try {
      const quiz = await QuizService.createQuiz(
        {
          ...req.validatedBody,
          createdBy: req.user?.id || req.user?._id,
          updatedBy: req.user?.id || req.user?._id,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        code: QUIZ_CODES.QUIZ_CREATED,
        message: "Tạo quiz thành công",
        data: { quiz },
      });
    } catch (err) {
      console.error("Create quiz error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUIZ_CODES.QUIZ_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async createMany(req, res) {
    try {
      const result = await QuizService.bulkCreateQuizzes(
        req.body,
        getUserIdentifier(req.user)
      );

      return res.status(201).json({
        success: true,
        code: QUIZ_CODES.QUIZ_BULK_CREATED,
        data: {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        },
        summary: result.summary,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode || 400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      console.error("QUIZ BULK ERROR:", err);

      return res.status(500).json({
        success: false,
        code: QUIZ_CODES.QUIZ_BULK_CREATE_FAILED,
        message: "Import quiz thất bại",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await QuizService.listAdminQuizzesUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: QUIZ_CODES.QUIZ_LIST_SUCCESS,
        message: "Lấy danh sách quiz thành công",
        quizzes: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("QUIZ LIST ERROR:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUIZ_CODES.QUIZ_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async listPublic(req, res) {
    try {
      const result = await QuizService.listPublicQuizzesUseCase({
        query: req.query,
        userId: req.user.id,
        role: req.user.active_role,
      });

      return res.json({
        success: true,
        quizzes: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("QUIZ PUBLIC LIST ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
  async options(req, res) {
    try {
      const options = await QuizService.getQuizOptions({
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: QUIZ_CODES.QUIZ_LIST_SUCCESS,
        message: "Lấy quiz options thành công",
        data: options,
      });
    } catch (err) {
      console.error("Quiz options error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUIZ_CODES.QUIZ_LIST_FAILED,
        message: "Server error",
      });
    }
  },
  async myQuizzes(req, res) {
    try {
      const result = await QuizService.listMyQuizzesUseCase({
        userId: req.user.id,
        query: req.query,
      });

      return res.json({
        success: true,
        code: QUIZ_CODES.QUIZ_MY_LIST_SUCCESS,
        quizzes: result,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("MY QUIZ ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  async detailBySlug(req, res) {
    try {
      const { slug } = req.params;
      const quizRaw = await QuizService.getQuizBySlug(slug);

      if (!quizRaw || !quizRaw.isPublished) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      return res.json({ success: true, quiz: mapDoc(quizRaw) });
    } catch (err) {
      console.error("detailBySlug error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },

  async detailById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid quiz ID" });
      }

      const quizRaw = await QuizService.getQuizById(id);

      if (!quizRaw) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      return res.json({ success: true, quiz: mapDoc(quizRaw) });
    } catch (err) {
      console.error("detailById error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      const quiz = await QuizService.updateQuiz(
        id,
        req.validatedBody,
        req.user
      );

      return res.json({
        success: true,
        code: QUIZ_CODES.QUIZ_UPDATED,
        message: "Cập nhật quiz thành công",
        data: {
          quiz,
        },
      });
    } catch (err) {
      console.error("Update quiz error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUIZ_CODES.QUIZ_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async remove(req, res) {
    try {
      const oldRaw = await Quiz.findById(req.params.id);
      if (!oldRaw) return res.status(404).json({ error: "Quiz not found" });

      const oldData = mapDoc(oldRaw);

      await Quiz.findByIdAndDelete(req.params.id);

      await saveAuditLogs({
        entityType: "quiz",
        entityId: req.params.id,
        oldData,
        newData: {},
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete quiz error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await QuizService.removeManyQuizzes(
        req.body.data?.ids,
        req.user
      );

      return res.json({
        success: true,
        code: QUIZ_CODES.QUIZ_DELETE_SUCCESS,
        message: "Xóa quiz thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many quizzes error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUIZ_CODES.QUIZ_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async previewExportQuizzes(req, res) {
    try {
      const result = await QuizService.previewExportQuizzes({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: QUIZ_CODES.QUIZ_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      console.log(err);

      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || QUIZ_CODES.QUIZ_EXPORT_FAILED,
        message: err.message,
      });
    }
  },

  async exportQuizzes(req, res) {
    try {
      const result = await QuizService.exportQuizzes({
        payload: req.body,
        user: req.user,
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );

      res.setHeader("Content-Type", result.contentType);

      return res.send(result.buffer);
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || QUIZ_CODES.QUIZ_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
};
