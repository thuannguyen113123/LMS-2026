import mongoose from "mongoose";

import StudentService from "../../services/student/student.service.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import { studentSchema } from "../../validators/student/student.validator.js";
import { STUDENT_CODES } from "../../constants/student.codes.js";
import AppError from "../../utils/AppError.js";

export function getUserIdentifier(user) {
  return user?._id || user?.id || null;
}

const mapDoc = (doc) => {
  if (doc?.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id?.toString(), ...rest };
};

export const studentController = {
  async create(req, res) {
    try {
      const student = await StudentService.createStudent(
        req.validatedBody,
        req.user
      );

      return res.status(201).json({
        success: true,
        code: STUDENT_CODES.STUDENT_CREATED,
        message: "Tạo student thành công",
        data: {
          student,
        },
      });
    } catch (err) {
      console.error("Create student error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.STUDENT_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async createMany(req, res) {
    try {
      const result = await StudentService.bulkCreateStudents(
        req.body,
        getUserIdentifier(req.user)
      );

      return res.status(201).json({
        success: true,
        code: STUDENT_CODES.STUDENT_BULK_CREATED,
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

      console.error("STUDENT BULK ERROR:", err);

      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.STUDENT_BULK_CREATE_FAILED,
        message: "Import student thất bại",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await StudentService.listAdminStudentsUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        code: STUDENT_CODES.STUDENT_LIST_SUCCESS,
        message: "Lấy danh sách sinh viên thành công",
        students: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("Student list error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.STUDENT_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async listPublic(req, res) {
    try {
      const result = await StudentService.listPublicStudentsUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        students: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  async detail(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ error: "ID không hợp lệ" });

      const studentRaw = await StudentService.findById(id)
        .populate("user", "fullname email")
        .populate("enrolledCourses.course", "title category price")
        .populate("bookmarks.course", "title")
        .populate("certificates.course", "title")
        .lean();

      if (!studentRaw)
        return res.status(404).json({ error: "Không tìm thấy student" });

      res.json({ success: true, student: mapDoc(studentRaw) });
    } catch (err) {
      console.error("Detail student error:", err);
      res.status(500).json({ error: "Lỗi server" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = studentSchema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      const oldRaw = await StudentServiceModel.findById(id);
      if (!oldRaw)
        return res.status(404).json({ error: "Không tìm thấy student" });

      const oldData = mapDoc(oldRaw);
      await StudentServiceModel.findByIdAndUpdate(id, value, { new: true });
      const updated = await StudentServiceModel.findById(id).lean();
      const student = mapDoc(updated);

      await saveAuditLogs({
        entityType: "students",
        entityId: id,
        oldData,
        newData: student,
        updatedBy: getUserIdentifier(req.user),
      });

      res.json({ success: true, student });
    } catch (err) {
      console.error("Update student error:", err);
      res.status(500).json({ error: "Lỗi server" });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const oldRaw = await StudentService.findById(id);
      if (!oldRaw)
        return res.status(404).json({ error: "Không tìm thấy student" });

      const oldData = mapDoc(oldRaw);
      await StudentService.findByIdAndDelete(id);

      await saveAuditLogs({
        entityType: "students",
        entityId: id,
        oldData,
        newData: {},
        updatedBy: getUserIdentifier(req.user),
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Remove student error:", err);
      res.status(500).json({ error: "Lỗi server" });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await StudentService.removeManyStudents(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: STUDENT_CODES.STUDENT_DELETE_SUCCESS,
        message: "Xóa học sinh thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many students error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.STUDENT_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async rateInstructor(req, res) {
    try {
      const userId = req.user.id;
      const { instructorId, rating } = req.body;

      await StudentService.rateInstructor({
        userId,
        instructorId,
        rating,
      });

      return res.json({
        success: true,
        code: STUDENT_CODES.INSTRUCTOR_RATING_SUCCESS,
        message: "Đánh giá giảng viên thành công",
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
        message: "Server error",
      });
    }
  },
  async removeInstructorRating(req, res) {
    const userId = req.user.id;

    const { instructorId } = req.params;

    await StudentService.removeInstructorRating({
      userId: userId,
      instructorId,
    });

    return res.json({
      success: true,
      code: STUDENT_CODES.INSTRUCTOR_RATING_REMOVED,
    });
  },
  async previewExportStudents(req, res) {
    try {
      const result = await StudentService.previewExportStudents({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: STUDENT_CODES.STUDENT_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || STUDENT_CODES.STUDENT_EXPORT_FAILED,
        message: err.message,
      });
    }
  },

  async exportStudents(req, res) {
    try {
      const result = await StudentService.exportStudents({
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
        code: err.code || STUDENT_CODES.STUDENT_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
};
