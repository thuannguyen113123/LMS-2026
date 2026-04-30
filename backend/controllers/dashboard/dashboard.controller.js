import * as dashboardService from "../../services/dashboard/dashboard.service.js";
import AppError from "../../utils/AppError.js";
import { DASHBOARD_CODES } from "../../constants/dashboard.codes.js";

export const dashboardController = {
  async getDashboard(req, res) {
    try {
      const role =
        req.user?.activeRole?.name || req.user?.active_role || req.user?.role;

      const userId = req.user?.id || req.user?._id;

      let data;

      switch (role) {
        case "admin":
          data = await dashboardService.getAdminDashboard();
          break;

        case "instructor":
          data = await dashboardService.getInstructorDashboard(userId);
          break;

        case "student":
          data = await dashboardService.getStudentDashboard(userId);
          break;

        default:
          throw new AppError(
            "Role không hợp lệ",
            403,
            DASHBOARD_CODES.INVALID_ROLE
          );
      }

      return res.status(200).json({
        success: true,
        code: DASHBOARD_CODES.DASHBOARD_FETCHED,
        message: "Lấy dashboard thành công",
        data,
      });
    } catch (err) {
      console.error("Dashboard error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: DASHBOARD_CODES.DASHBOARD_FETCH_FAILED,
        message: "Lỗi server",
      });
    }
  },
};
