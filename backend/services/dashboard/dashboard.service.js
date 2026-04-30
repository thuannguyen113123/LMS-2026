import * as agg from "./dashboard.aggregate.js";
import Course from "../../models/courses/Course.js";
import Student from "../../models/student/student.model.js";
import Instructor from "../../models/instructor/instructor.model.js";

export const getAdminDashboard = async () => {
  const [
    kpis,
    revenueTrend,
    userGrowth,
    courseGrowth,
    topCourses,
    recentOrders,
    recentUsers,
    auditLogs,
    reportedComments,
    activeChats,
  ] = await Promise.all([
    agg.getAdminKPIs(),
    agg.getRevenueTrend(),
    agg.getUserGrowth(),
    agg.getCourseGrowth(),
    agg.getTopCourses(),
    agg.getRecentOrders(),
    agg.getRecentUsers(),
    agg.getRecentAuditLogs(),
    agg.getReportedComments(),
    agg.getActiveChats(),
  ]);

  return {
    kpis,
    charts: {
      revenueTrend,
      userGrowth,
      courseGrowth,
      topCourses,
    },
    panels: {
      recentOrders,
      recentUsers,
      auditLogs,
      reportedComments,
      activeChats,
    },
  };
};

export const getInstructorDashboard = async (userId) => {
  const instructor = await Instructor.findOne({ user: userId }).lean();

  if (!instructor) {
    throw new AppError("Instructor not found", 404);
  }

  const instructorId = instructor._id;

  const courses = await Course.find({
    instructor: instructorId,
  }).select("_id");

  const courseIds = courses.map((c) => c._id);

  // 3. aggregate song song
  const [kpis, topCourses, analytics, enrollments, quizAttempts, comments] =
    await Promise.all([
      agg.getInstructorKPIs(instructorId),
      agg.getInstructorTopCourses(courseIds),
      agg.getLearningAnalytics(courseIds),
      agg.getRecentEnrollments(courseIds),
      agg.getRecentQuizAttempts(courseIds),
      agg.getRecentComments(courseIds),
    ]);

  return {
    kpis,
    charts: {
      topCourses,
    },
    analytics,
    panels: {
      enrollments,
      quizAttempts,
      comments,
    },
  };
};
export const getStudentDashboard = async (userId) => {
  const student = await Student.findOne({ user: userId }).lean();

  if (!student) return null;

  const studentObjectId = student._id;

  const courseIds = student.enrolledCourses.map((c) => c.course);

  const [
    kpis,
    continueLearning,
    progressChart,
    notifications,
    quizzes,
    bookmarks,
    comments,
  ] = await Promise.all([
    agg.getStudentKPIs(userId),
    agg.getContinueLearning(userId),
    agg.getStudentProgressChart(studentObjectId),
    agg.getStudentNotifications(userId),
    agg.getUpcomingQuizzes(courseIds),
    agg.getBookmarks(userId),
    agg.getStudentComments(userId),
  ]);

  return {
    kpis,
    charts: {
      progressChart,
    },
    learning: {
      continueLearning,
      quizzes,
      bookmarks,
    },
    panels: {
      notifications,
      comments,
    },
  };
};
