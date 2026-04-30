import { QUESTION_CODES } from "../../constants/question.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import AppError from "../../utils/AppError.js";
import { questionUpdateSchema } from "../../validators/quiz/question.validator.js";
import QuestionService from "./../../services/question/questionServices.js";
import mongoose from "mongoose";

export function getUserIdentifier(user) {
  return user?._id || user?.id || null;
}

const mapDoc = (doc) => {
  if (doc.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const questionController = {
  async create(req, res) {
    try {
      const question = await QuestionService.createQuestion(
        req.validatedBody,
        req.user
      );

      return res.status(201).json({
        success: true,
        code: QUESTION_CODES.QUESTION_CREATED,
        message: "Tạo câu hỏi thành công",
        data: {
          question,
        },
      });
    } catch (err) {
      console.error("Create question error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUESTION_CODES.QUESTION_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async createMany(req, res) {
    try {
      const result = await QuestionService.bulkCreateQuestions(
        req.body,
        getUserIdentifier(req.user)
      );

      return res.status(201).json({
        success: true,
        code: QUESTION_CODES.QUESTION_BULK_CREATED,
        data: {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        },
        summary: result.summary,
      });
    } catch (err) {
      console.log(err);

      if (err instanceof AppError) {
        return res.status(err.statusCode || 400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUESTION_CODES.QUESTION_BULK_CREATE_FAILED,
        message: "Import question thất bại",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await QuestionService.listAdminQuestionsUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
        quizSlug: req.params.slug || null,
      });

      return res.json({
        success: true,
        code: QUESTION_CODES.QUESTION_LIST_SUCCESS,
        questions: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List admin questions error:", err);

      return res.status(500).json({
        success: false,
        code: QUESTION_CODES.QUESTION_LIST_FAILED,
        message: "Server error",
      });
    }
  },

  async listPublic(req, res) {
    try {
      const result = await QuestionService.listPublicQuestionsUseCase({
        query: req.query,
        quizSlug: req.params.slug || null,
      });

      return res.json({
        success: true,
        questions: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List public questions error:", err);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  async getByQuiz(req, res) {
    try {
      const { quizId } = req.params;

      if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({
          success: false,
          code: QUESTION_CODES.QUESTION_QUIZ_NOT_FOUND,
          message: "Quiz không hợp lệ",
        });
      }

      const result = await QuestionService.getByQuizUseCase({
        quizId,
        role: req.user.active_role || null,
        userId: req.user?.id || null,
      });

      if (!result.data.length) {
        return res.status(404).json({
          success: false,
          code: QUESTION_CODES.QUESTION_NOT_FOUND,
          message: "Không có câu hỏi cho quiz này",
        });
      }

      return res.json({
        success: true,
        code: QUESTION_CODES.QUESTION_GET_BY_QUIZ_SUCCESS,
        questions: result.data,
        total: result.total,
      });
    } catch (err) {
      console.error("Get by quiz error:", err);

      return res.status(500).json({
        success: false,
        code: QUESTION_CODES.QUESTION_GET_BY_QUIZ_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async detail(req, res) {
    try {
      const { id } = req.params;

      const questionRaw = await QuestionService.getDetail(id);
      if (!questionRaw)
        return res.status(404).json({ error: "Không tìm thấy câu hỏi" });

      const question = mapDoc(questionRaw);

      return res.json({ success: true, question });
    } catch (err) {
      console.error("Detail error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      const { error, value } = questionUpdateSchema.validate(req.body);
      if (error)
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });

      const question = await QuestionService.updateQuestionUseCase({
        id,
        data: value,
        user: req.user,
      });

      return res.json({
        success: true,
        code: QUESTION_CODES.QUESTION_UPDATED,
        data: question,
      });
    } catch (err) {
      console.error("Update question error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUESTION_CODES.QUESTION_UPDATE_FAILED,
        message: "Server error",
      });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;

      const oldRaw = await QuestionService.getDetail(id);
      if (!oldRaw) return res.status(404).json({ error: "Question not found" });

      const oldData = mapDoc(oldRaw);

      await QuestionService.deleteQuestion(id);

      await saveAuditLogs({
        entityType: "questions",
        entityId: id,
        oldData,
        newData: {},
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete question error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await QuestionService.removeManyQuestions(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: QUESTION_CODES.QUESTION_MANY_DELETED,
        message: "Xóa câu hỏi thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many questions error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUESTION_CODES.QUESTION_MANY_DELETE_FAILED,
        message: "Server error",
      });
    }
  },
  async previewExportQuestions(req, res) {
    try {
      const result = await QuestionService.previewExportQuestions({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: QUESTION_CODES.QUESTION_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || QUESTION_CODES.QUESTION_EXPORT_FAILED,
        message: err.message,
      });
    }
  },

  async exportQuestions(req, res) {
    try {
      const result = await QuestionService.exportQuestions({
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
        code: err.code || QUESTION_CODES.QUESTION_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
};
