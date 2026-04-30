import Lesson from "../../models/lesson/lesson.model.js";
import Instructor from "../../models/instructor/instructor.model.js";
import Student from "../../models/student/student.model.js";

import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import LessonService from "../../services/lesson/lesson.service.js";

import AppError from "../../utils/AppError.js";
import { LESSON_CODES } from "../../constants/lesson.codes.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

const mapDoc = (doc) => {
  if (doc?.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const lessonController = {
  async create(req, res) {
    try {
      const lesson = await LessonService.createLesson(
        req.validatedBody,
        req.user
      );

      return res.status(201).json({
        success: true,
        code: LESSON_CODES.LESSON_CREATED,
        message: "Tạo bài học thành công",
        data: {
          lesson,
        },
      });
    } catch (err) {
      console.error("Create lesson error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_CODES.LESSON_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async createMany(req, res) {
    try {
      const result = await LessonService.bulkCreateLessons(req.body, req.user);

      return res.status(201).json({
        success: true,
        code: LESSON_CODES.LESSON_BULK_CREATED,
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

      console.error("LESSON BULK ERROR:", err);

      return res.status(500).json({
        success: false,
        code: LESSON_CODES.LESSON_BULK_CREATE_FAILED,
        message: "Import lesson thất bại",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await LessonService.listAdminLessonsUseCase({
        query: req.query,
        courseSlug: req.params.slug,
        role: req.user.active_role || null,
        userId: req.user?.id || null,
      });

      return res.json({
        success: true,
        code: LESSON_CODES.LESSON_LIST_SUCCESS,
        message: "Lấy danh sách bài học thành công",
        lessons: result.data,
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
        code: LESSON_CODES.LESSON_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  // PUBLIC
  async listPublic(req, res) {
    try {
      const result = await LessonService.listPublicLessonsUseCase({
        query: req.query,
        courseSlug: req.query.slug,
        isPublic: true,
      });

      return res.json({
        success: true,
        code: LESSON_CODES.LESSON_LIST_SUCCESS,
        message: "Lấy danh sách bài học thành công",
        lessons: result.data,
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
        code: LESSON_CODES.LESSON_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async listForUser(req, res) {
    try {
      const { active_role, id: userId } = req.user;
      let lessons = [];

      if (active_role === "instructor") {
        const instructor = await Instructor.findOne({ user: userId }).lean();
        if (!instructor) {
          return res
            .status(404)
            .json({ success: false, message: "Không tìm thấy giảng viên" });
        }

        const courseIds = (instructor.coursesTaught || []).map((c) => c.course);
        lessons = await Lesson.find({ course: { $in: courseIds } })
          .populate("course", "title slug thumbnail")
          .lean();
      } else if (active_role === "student") {
        const student = await Student.findOne({ user: userId }).lean();
        if (!student) {
          return res
            .status(404)
            .json({ success: false, message: "Không tìm thấy học sinh" });
        }

        const enrolledCourseIds = (student.enrolledCourses || []).map(
          (ec) => ec.course
        );
        lessons = await Lesson.find({
          course: { $in: enrolledCourseIds },
          isPublished: true,
        })
          .populate("course", "title slug thumbnail")
          .lean();
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      }

      const mappedLessons = lessons.map(mapDoc);

      return res.json({ success: true, lessons: mappedLessons });
    } catch (err) {
      console.error("List lessons for user error:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  async detail(req, res) {
    try {
      const { id } = req.params;

      const lesson = await Lesson.findById(id).populate([
        { path: "course", select: "title slug thumbnail" },
      ]);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy bài học",
        });
      }

      return res.status(200).json({
        success: true,
        data: lesson,
      });
    } catch (err) {
      console.error("Lesson detail error:", err);
      return res.status(500).json({
        success: false,
        error: "Lỗi server",
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      const lesson = await LessonService.updateLesson(
        id,
        req.validatedBody,
        req.user
      );

      return res.json({
        success: true,
        code: LESSON_CODES.LESSON_UPDATED,
        message: "Cập nhật bài học thành công",
        data: {
          lesson,
        },
      });
    } catch (err) {
      console.error("Update lesson error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_CODES.LESSON_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;

      const oldDataRaw = await LessonService.getLessonById(id);
      if (!oldDataRaw) {
        return res.status(404).json({
          error: "Không tìm thấy bài học để xóa",
        });
      }

      const oldData = mapDoc(oldDataRaw);

      await LessonService.deleteLesson(id);

      await saveAuditLogs({
        entityType: "lessons",
        entityId: id,
        oldData,
        newData: {},
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete lesson error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await LessonService.removeManyLessons(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: LESSON_CODES.LESSON_DELETE_SUCCESS,
        message: "Xóa bài học thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many lessons error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: LESSON_CODES.LESSON_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async previewExportLessons(req, res) {
    try {
      const result = await LessonService.previewExportLessons({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: LESSON_CODES.LESSON_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || LESSON_CODES.LESSON_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
  async exportLessons(req, res) {
    try {
      const result = await LessonService.exportLessons({
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
        code: err.code || LESSON_CODES.LESSON_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
};
