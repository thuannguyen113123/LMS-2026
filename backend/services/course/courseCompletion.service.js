import LessonProgress from "../../models/lessonProgress/lessonProgress.model.js";
import Student from "../../models/student/student.model.js";
import Course from "../../models/courses/Course.js";
import Lesson from "../../models/lesson/lesson.model.js";
import studentCertificateService from "../certificate/studentCertificate.service.js";
import mongoose from "mongoose";

async function getCourseInstructor(courseId) {
  const course = await Course.findById(courseId).select("instructor");
  return course?.instructor;
}

export async function checkAndCompleteCourse({ studentId, courseId }) {
  const studentObjectId = new mongoose.Types.ObjectId(studentId);
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  //  total lessons
  const totalLessons = await Lesson.countDocuments({
    course: courseObjectId,
    isPublished: true,
  });

  if (!totalLessons) return;

  // completed lessons
  const completedLessons = await LessonProgress.countDocuments({
    student: studentObjectId,
    course: courseObjectId,
    status: "completed",
  });

  // CALCULATE COURSE PROGRESS
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  const isCompleted = progressPercent === 100;

  // UPDATE STUDENT SNAPSHOT
  await Student.updateOne(
    {
      _id: studentObjectId,
      "enrolledCourses.course": courseObjectId,
    },
    {
      $set: {
        "enrolledCourses.$.progress": progressPercent,
        "enrolledCourses.$.completed": isCompleted,
        "enrolledCourses.$.lastAccessed": new Date(),
      },
    }
  );

  // ISSUE CERTIFICATE ONLY ONCE
  if (!isCompleted) return;

  const instructorId = await getCourseInstructor(courseObjectId);

  return await studentCertificateService.issueCertificate({
    studentId: studentObjectId,
    courseId: courseObjectId,
    instructorId,
  });
}
