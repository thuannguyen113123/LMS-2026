import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import StudentQuizAttemptService from "../../services/StudentQuizAttempt/StudentQuizAttemptServices.js";
import Student from "../../models/student/student.model.js";

import { QUIZ_ATTEMPT_CODES } from "../../constants/quizAttempt.codes.js";
import AppError from "../../utils/AppError.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

const mapDoc = (doc) => {
  if (!doc) return null;
  if (doc?.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id?.toString(), ...rest };
};

export const studentQuizAttemptController = {
  async start(req, res) {
    try {
      const { quizId, lessonId } = req.validatedBody;

      const student = await Student.findOne({ user: req.user.id }).lean();

      const attempt = await StudentQuizAttemptService.startAttempt({
        quizId,
        lessonId,
        student: student._id,
      });
      if (attempt.reviewMode) {
        return res.json({
          success: true,
          code: "QUIZ_ALREADY_COMPLETED",
          message: "Bạn đã hoàn thành quiz này",
          data: {
            canReview: true,
            attemptId: attempt.attemptId,
          },
        });
      }
      return res.status(201).json({
        success: true,
        code: QUIZ_ATTEMPT_CODES.QUIZ_ATTEMPT_STARTED,
        message: "Bắt đầu quiz thành công",
        data: { attempt },
      });
    } catch (err) {
      console.error("Start quiz attempt error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: QUIZ_ATTEMPT_CODES.QUIZ_ATTEMPT_START_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async submit(req, res) {
    try {
      const { attemptId } = req.params;
      const { answers } = req.body;
      const student = await Student.findOne({ user: req.user.id }).lean();

      if (!Array.isArray(answers)) {
        return res.status(400).json({ error: "Answers invalid" });
      }

      const updated = await StudentQuizAttemptService.submitAttempt({
        attemptId,
        student: student._id,
        answers,
      });

      if (!updated) {
        return res.status(404).json({ error: "Không tìm thấy attempt" });
      }

      const data = mapDoc(updated);

      await saveAuditLogs({
        entityType: "student_quiz_attempts",
        entityId: attemptId,
        oldData: {},
        newData: data,
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({ success: true, attempt: data });
    } catch (err) {
      console.error("Submit attempt err:", err);
      return res.status(500).json({ error: err.message || "Lỗi server" });
    }
  },

  async list(req, res) {
    try {
      const result = await StudentQuizAttemptService.listAttemptsUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: "ATTEMPT_LIST_SUCCESS",
        message: "Lấy danh sách kết quả quiz thành công",
        attempts: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List attempt error:", err);

      return res.status(500).json({
        success: false,
        code: "ATTEMPT_LIST_FAILED",
        message: "Server error",
      });
    }
  },
  async detail(req, res) {
    try {
      const data = await StudentQuizAttemptService.getAttemptDetailUseCase({
        attemptId: req.params.id,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: "ATTEMPT_DETAIL_SUCCESS",
        attempt: data,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        code: "ATTEMPT_DETAIL_FAILED",
        message: "Server error",
      });
    }
  },
  async listAnswers(req, res) {
    try {
      const result = await StudentQuizAttemptService.listAttemptAnswersUseCase({
        attemptId: req.params.attemptId,
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: "ATTEMPT_ANSWERS_SUCCESS",
        answers: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        code: "ATTEMPT_ANSWERS_FAILED",
      });
    }
  },

  async remove(req, res) {
    try {
      const doc = await StudentQuizAttemptService.deleteOne(req.params.id);
      if (!doc) return res.status(404).json({ error: "Không tìm thấy để xóa" });

      await saveAuditLogs({
        entityType: "student_quiz_attempts",
        entityId: req.params.id,
        oldData: mapDoc(doc),
        newData: {},
        updatedBy: getUserIdentifier(req.user),
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Remove attempt error:", err);
      res.status(500).json({ error: "Lỗi server" });
    }
  },

  async removeMany(req, res) {
    try {
      const { ids } = req.body;
      const docs = await StudentQuizAttemptService.deleteMany(ids);

      if (!docs || docs.length === 0)
        return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
      for (const d of docs) {
        await saveAuditLogs({
          entityType: "student_quiz_attempts",
          entityId: d._id,
          oldData: mapDoc(d),
          newData: {},
          updatedBy: getUserIdentifier(req.user),
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Remove many attempt error:", err);
      res.status(500).json({ error: "Lỗi server" });
    }
  },
};
