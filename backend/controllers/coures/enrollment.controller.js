import mongoose from "mongoose";
import EnrollmentModel from "../../services/course/enrollment.service.js";

export const enrollmentController = {
  async enrollFreeCourse(req, res) {
    try {
      const { id: courseId } = req.params;

      // 1. Validate courseId
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
          success: false,
          error: "Course ID không hợp lệ",
        });
      }

      // 2. Ghi danh
      const result = await EnrollmentModel.enrollStudentToCourse({
        userId: req.user._id || req.user.id,
        courseId,
        source: "free",
      });

      // 3. Trả về thông tin enroll
      return res.json({
        success: true,
        enrolled: result.enrolled, // true nếu đã enroll hoặc enroll mới
        alreadyEnrolled: result.alreadyEnrolled, // true nếu đã enroll trước
      });
    } catch (err) {
      console.error("❌ [EnrollmentController.enrollFreeCourse] Error:", err);

      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  },
};
