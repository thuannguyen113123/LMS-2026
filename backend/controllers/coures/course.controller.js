import CourseService from "../../services/course/course.services.js";
import Student from "../../models/student/student.model.js";

import { COURSE_CODES } from "../../constants/course.codes.js";
import AppError from "../../utils/AppError.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

export const courseController = {
  async create(req, res) {
    try {
      const course = await CourseService.createCourse(
        {
          ...req.validatedBody,
          createdBy: req.user?.id || req.user?._id,
          updatedBy: req.user?.id || req.user?._id,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        code: COURSE_CODES.COURSE_CREATED,
        message: "Tạo khóa học thành công",
        data: {
          course,
        },
      });
    } catch (err) {
      console.error("Create course error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COURSE_CODES.COURSE_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async createMany(req, res) {
    try {
      const result = await CourseService.bulkCreateCourses(
        req.body,
        getUserIdentifier(req.user)
      );

      return res.status(201).json({
        success: true,
        code: COURSE_CODES.COURSE_BULK_CREATED,
        data: {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        },
        summary: result.summary,
      });
    } catch (err) {
      if (err instanceof AppError) {
        console.warn("COURSE BULK VALIDATION:", {
          code: err.code,
          message: err.message,
        });

        return res.status(err.statusCode || 400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      console.error("COURSE BULK UNEXPECTED ERROR:", err);

      return res.status(500).json({
        success: false,
        code: COURSE_CODES.COURSE_BULK_CREATE_FAILED,
        message: "Import course thất bại",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await CourseService.listAdminCoursesUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: COURSE_CODES.COURSE_LIST_SUCCESS,
        message: "Lấy danh sách khóa học thành công",
        courses: result.data,
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
        code: COURSE_CODES.COURSE_LIST_FAILED,
        message: "Server error",
      });
    }
  },

  async listPublic(req, res) {
    try {
      const result = await CourseService.listPublicCoursesUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        courses: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
  async options(req, res) {
    try {
      const options = await CourseService.getCourseOptions({
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: COURSE_CODES.COURSE_LIST_SUCCESS,
        message: "Lấy course options thành công",
        data: options,
      });
    } catch (err) {
      console.error("Course options error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COURSE_CODES.COURSE_LIST_FAILED,
        message: "Server error",
      });
    }
  },
  //My course
  async listMyCourses(req, res) {
    try {
      const result = await CourseService.listMyCoursesUseCase({
        query: req.query,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        courses: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
  //Khóa học đề xuất
  async recommended(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;

      const courses = await CourseService.getRecommendedCourses({
        courseId: id,
        userId,
        limit: 4,
      });

      res.json({
        success: true,
        courses,
      });
    } catch (err) {
      console.error("Recommended courses error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async detail(req, res) {
    try {
      const course = await CourseService.getCourseDetail(
        req.params.slug,
        req.user
      );

      return res.status(200).json({
        success: true,
        code: COURSE_CODES.COURSE_DETAIL_SUCCESS,
        message: "Lấy chi tiết khóa học thành công",
        data: {
          course,
        },
      });
    } catch (err) {
      console.error("Course detail error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COURSE_CODES.COURSE_DETAIL_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      const course = await CourseService.updateCourse(
        id,
        req.validatedBody,
        req.user
      );

      return res.json({
        success: true,
        code: COURSE_CODES.COURSE_UPDATED,
        message: "Cập nhật khóa học thành công",
        data: {
          course,
        },
      });
    } catch (err) {
      console.error("Update course error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COURSE_CODES.COURSE_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async publish(req, res) {
    try {
      const result = await CourseService.publishCourse(req.params.id, req.user);

      return res.json({
        success: true,
        code: result.code,
        message: "Publish khóa học thành công",
        data: {
          course: result.course,
        },
      });
    } catch (err) {
      console.error("Publish course error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COURSE_CODES.COURSE_PUBLISH_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await CourseService.removeManyCourses(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: COURSE_CODES.COURSE_DELETE_SUCCESS,
        message: "Xóa khóa học thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many courses error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COURSE_CODES.COURSE_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async previewExportCourses(req, res) {
    try {
      const result = await CourseService.previewExportCourses({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: COURSE_CODES.COURSE_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || COURSE_CODES.COURSE_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
  async exportCourses(req, res) {
    try {
      const result = await CourseService.exportCourses({
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
        code: err.code || COURSE_CODES.COURSE_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
  async getContinueLearning(req, res) {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }
      const student = await Student.findOne({ user: req.user.id }).lean();

      const courses = await CourseService.getContinueLearning(student._id);

      return res.status(200).json({
        success: true,
        code: COURSE_CODES.CONTINUE_LEARNING_FETCHED,
        message: "Lấy danh sách tiếp tục học thành công",
        data: {
          courses,
        },
      });
    } catch (err) {
      console.error("Continue learning error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COURSE_CODES.CONTINUE_LEARNING_FAILED,
        message: "Lỗi server",
      });
    }
  },
};
