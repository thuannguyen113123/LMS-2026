import InstructorRequestService from "../../services/instructorRequest/instructorRequest.service.js";
import { INSTRUCTOR_CODES } from "../../constants/instructor.codes.js";
import AppError from "../../utils/AppError.js";

export const instructorRequestController = {
  async requestUpgrade(req, res) {
    try {
      const result = await InstructorRequestService.requestUpgrade(req.user);

      return res.status(201).json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_REQUEST_CREATED,
        message: "Đã gửi yêu cầu",
        data: result,
      });
    } catch (err) {
      console.error("Request upgrade error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_REQUEST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  // ADMIN: duyệt
  async approve(req, res) {
    try {
      const { id } = req.params;

      const result = await InstructorRequestService.approveRequest(
        id,
        req.user
      );

      return res.json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_REQUEST_APPROVED,
        message: "Đã duyệt",
        data: result,
      });
    } catch (err) {
      console.error("Approve request error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_REQUEST_APPROVE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  // ADMIN: từ chối
  async reject(req, res) {
    try {
      const { id } = req.params;

      const result = await InstructorRequestService.rejectRequest(
        id,
        req.user,
        req.body.reason
      );

      return res.json({
        success: true,
        code: INSTRUCTOR_CODES.INSTRUCTOR_REQUEST_REJECTED,
        message: "Đã từ chối",
        data: result || null,
      });
    } catch (err) {
      console.error("Reject request error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: INSTRUCTOR_CODES.INSTRUCTOR_REQUEST_REJECT_FAILED,
        message: "Lỗi server",
      });
    }
  },
};
