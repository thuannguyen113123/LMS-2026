import Course from "../../models/courses/Course.js";
import Student from "../../models/student/student.model.js";
import Instructor from "../../models/instructor/instructor.model.js";
import ChatRoom from "../../models/chat/chatRoom.model.js";
import NotificationService, {
  TYPE_SETTING_MAP,
} from "../../services/notification/notification.service.js";

const EnrollmentModel = {
  async enrollStudentToCourse({ userId, courseId, source = "payment" }) {
    // 1️⃣ Lấy khóa học
    const course = await Course.findById(courseId).populate("instructor");

    if (!course) {
      throw new Error("Khóa học không tồn tại");
    }

    if (!course.isFree && source === "free") {
      throw new Error("Khóa học không miễn phí");
    }

    if (course.status !== "published") {
      throw new Error("Khóa học chưa được phát hành");
    }

    // 2️⃣ Lấy student
    const student = await Student.findOne({ user: userId });
    if (!student) {
      throw new Error("Student không tồn tại");
    }

    // 3️⃣ Kiểm tra đã enroll chưa
    const alreadyEnrolled = student.enrolledCourses.some(
      (item) => item.course.toString() === courseId.toString()
    );

    if (alreadyEnrolled) {
      return { enrolled: true, alreadyEnrolled: true, courseId, source };
    }

    // Thêm course vào student
    student.enrolledCourses.push({ course: courseId, enrolledAt: new Date() });
    await student.save();

    //Cập nhật stats của instructor
    if (course.instructor) {
      await Instructor.findByIdAndUpdate(course.instructor._id, {
        $inc: { totalStudents: 1 },
      });
    }
    // 6️⃣ AUTO ADD CHAT ROOM
    const chatRoom = await ChatRoom.findOne({
      type: "course",
      course_id: courseId,
    });

    if (chatRoom) {
      await ChatRoom.findByIdAndUpdate(chatRoom._id, {
        $addToSet: { user_ids: student.user },
      });
    }
    if (course.instructor?.user) {
      await NotificationService.send({
        userId: course.instructor.user,
        type: TYPE_SETTING_MAP.STUDENT_ENROLLED,
        title: "Học viên mới",
        message: "Có học viên đăng ký khóa học của bạn",
        entityId: course.id,
        entityType: "Course",
        meta: {
          studentId: student.user,
        },
      });
    }
    return { enrolled: true, alreadyEnrolled: false, courseId, source };
  },
};

export default EnrollmentModel;
