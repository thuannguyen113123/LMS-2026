import { useNavigate } from "react-router-dom";
import {
  FaStar,
  FaUsers,
  FaPlayCircle,
  FaClock,
  FaSignal,
  FaGlobe,
  FaInfinity,
  FaMobileAlt,
} from "react-icons/fa";

export default function FreeCourseSidebar({
  course,
  enrolled,
  enrolling,
  handleEnrollFree,
}) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-24">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="relative group">
          <img
            src={course.coverImage}
            alt={course.title}
            className="w-full h-48 object-cover"
          />

          {/* Badge */}
          <div className="absolute top-4 left-4 bg-primary-soft text-primary text-xs px-3 py-1 rounded-full">
            Miễn phí
          </div>
        </div>

        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-semibold text-primary leading-snug mb-3">
            {course.title}
          </h3>

          {/* Social proof */}
          <div className="flex items-center justify-between text-sm text-primary/70 mb-5">
            <div className="flex items-center gap-1">
              <FaStar className="text-primary" size={14} />
              <span>{course.rating || "4.8"}</span>
            </div>

            <div className="flex items-center gap-1">
              <FaUsers size={14} />
              <span>{course.totalStudents || 1200}+ học viên</span>
            </div>
          </div>

          {/* CTA */}
          {!enrolled ? (
            <button
              onClick={handleEnrollFree}
              disabled={enrolling}
              className="w-full bg-linear-to-r  from-blue-600 to-indigo-600 text-white text-primary-foreground py-3 rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              {enrolling ? "Đang xử lý..." : "Đăng ký miễn phí"}
            </button>
          ) : (
            <button
              onClick={() => navigate(`/courses/${course.slug}/learning`)}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              Vào học
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-border my-6"></div>

          {/* Course Info */}
          <div className="space-y-4 text-sm text-primary/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaPlayCircle size={14} />
                <span>Bài học</span>
              </div>
              <span className="font-medium">{course.totalLessons || 24}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaClock size={14} />
                <span>Thời lượng</span>
              </div>
              <span className="font-medium">
                {course.totalDuration || "5 giờ"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaSignal size={14} />
                <span>Cấp độ</span>
              </div>
              <span className="font-medium">{course.level || "Cơ bản"}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaGlobe size={14} />
                <span>Ngôn ngữ</span>
              </div>
              <span className="font-medium">
                {course.language || "Tiếng Việt"}
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-muted border border-border rounded-xl p-4 mt-6 text-sm space-y-3">
            <div className="flex items-center gap-2">
              <FaInfinity size={14} />
              <span>Truy cập trọn đời</span>
            </div>

            <div className="flex items-center gap-2">
              <FaMobileAlt size={14} />
              <span>Học trên mọi thiết bị</span>
            </div>

            <div className="flex items-center gap-2">
              <FaPlayCircle size={14} />
              <span>Cập nhật nội dung miễn phí</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
