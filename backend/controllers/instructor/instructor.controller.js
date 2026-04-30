import InstructorService from "../../services/instructor/instructor.service.js";
import Instructor from "../../models/instructor/instructor.model.js";

import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";

import { INSTRUCTOR_CODES } from "../../constants/instructor.codes.js";
import AppError from "../../utils/AppError.js";

export function getUserIdentifier(user) {
  return user?._id || user?.id || null;
}

const mapDoc = (doc) => {
  if (doc.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const instructorController = {
  async create(req, res) {
    try {
      const instructor = await InstructorService.createInstructor(
        {
          ...req.validatedBody,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_CREATED,
        message: "Tạo instructor thành công",
        data: {
          instructor,
        },
      });
    } catch (err) {
      console.error("Create instructor error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async createMany(req, res) {
    try {
      const result = await InstructorService.bulkCreateInstructors(
        req.body,
        getUserIdentifier(req.user)
      );

      return res.status(201).json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_BULK_CREATED,
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

      console.error("🔥 INSTRUCTOR BULK ERROR:", err);

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_BULK_CREATE_FAILED,
        message: "Import instructor thất bại",
      });
    }
  },
  async list(req, res) {
    try {
      const result = await InstructorService.listAdminInstructorsUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_LIST_SUCCESS,
        message: "Lấy danh sách instructor thành công",
        instructors: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List instructors error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_LIST_FAILED,
        message: "Server error",
      });
    }
  },

  async listPublic(req, res) {
    try {
      const result = await InstructorService.listPublicInstructorsUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        instructors: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
  async filterOptions(req, res) {
    try {
      const options = await InstructorService.getInstructorFilterOptions();

      return res.json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_FILTER_OPTIONS_SUCCESS,
        message: "Lấy filter options thành công",
        data: options,
      });
    } catch (err) {
      console.error("Instructor filter options error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_FILTER_OPTIONS_FAILED,
        message: "Server error",
      });
    }
  },
  async options(req, res) {
    try {
      const options = await InstructorService.getInstructorOptions();

      return res.json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_LIST_SUCCESS,
        message: "Lấy instructor options thành công",
        data: options,
      });
    } catch (err) {
      console.error("Instructor options error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_LIST_FAILED,
        message: "Server error",
      });
    }
  },
  async detailBySlug(req, res) {
    try {
      const { slug } = req.params;
      const instructorRaw = await InstructorService.findOne({ slug })
        .populate("user", "fullname email")
        .populate("coursesTaught.course", "title price duration")
        .lean();

      if (!instructorRaw)
        return res.status(404).json({ error: "Không tìm thấy instructor" });

      res.json({ success: true, instructor: mapDoc(instructorRaw) });
    } catch (err) {
      console.error("Detail instructor by slug error:", err);
      res.status(500).json({ error: "Lỗi server" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      const instructor = await InstructorService.updateInstructor(
        id,
        req.validatedBody,
        req.user
      );

      return res.json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_UPDATED,
        message: "Cập nhật giảng viên thành công",
        data: {
          instructor,
        },
      });
    } catch (err) {
      console.error("Update instructor error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await InstructorService.removeManyInstructors(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_DELETE_SUCCESS,
        message: "Xóa giảng viên thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many instructors error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async previewExportInstructors(req, res) {
    try {
      const result = await InstructorService.previewExportInstructors({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || INSTRUCTOR_CODES.INSTRUCTOR_EXPORT_FAILED,
        message: err.message,
      });
    }
  },

  async exportInstructors(req, res) {
    try {
      const result = await InstructorService.exportInstructors({
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
        code: err.code || INSTRUCTOR_CODES.INSTRUCTOR_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
};
