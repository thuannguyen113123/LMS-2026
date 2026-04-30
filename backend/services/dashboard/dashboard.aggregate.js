import User from "../../models/user/user.model.js";
import Instructor from "../../models/instructor/instructor.model.js";
import Course from "../../models/courses/Course.js";
import Order from "../../models/payment/order.model.js";
import Payment from "../../models/payment/payment.model.js";
import Lesson from "../../models/lesson/lesson.model.js";
import ChatRoom from "../../models/chat/chatRoom.model.js";
import LessonProgress from "../../models/lessonProgress/lessonProgress.model.js";
import AuditLog from "../../models/auditLog/AuditLog.js";
import Comment from "../../models/comment/comment.model.js";
import UserNotification from "../../models/chat/userNotification.model.js";
import Quiz from "../../models/quiz/quiz.model.js";
import Student from "../../models/student/student.model.js";

import mongoose from "mongoose";
export const getAdminKPIs = async () => {
  const [
    users,
    instructors,
    students,
    courses,
    orders,
    lessons,
    chats,
    revenueResult,
  ] = await Promise.all([
    User.countDocuments(),
    Instructor.countDocuments(),
    Student.countDocuments(),
    Course.countDocuments({ status: "published" }),
    Order.countDocuments(),
    Lesson.countDocuments({ isPublished: true }),
    ChatRoom.countDocuments(),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $unwind: "$transactions" },
      {
        $group: {
          _id: null,
          total: { $sum: "$transactions.amount" },
        },
      },
    ]),
  ]);

  return {
    totalUsers: users,
    totalStudents: students,
    totalInstructors: instructors,
    totalCourses: courses,
    totalOrders: orders,
    totalLessons: lessons,
    activeChats: chats,
    totalRevenue: revenueResult[0]?.total || 0,
  };
};
export const getInstructorKPIs = async (instructorId) => {
  const instructorObjectId = new mongoose.Types.ObjectId(instructorId);

  const instructorCourses = await Course.find({
    instructor: instructorObjectId,
  }).select("_id rating");

  const courseIds = instructorCourses.map((c) => c._id);

  const [totalCourses, lessons, studentsAgg, quizAttempts, revenueAgg] =
    await Promise.all([
      Course.countDocuments({ instructor: instructorObjectId }),

      Lesson.countDocuments({
        course: { $in: courseIds },
        isPublished: true,
      }),

      LessonProgress.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: "$student" } },
        { $count: "total" },
      ]),

      LessonProgress.countDocuments({
        course: { $in: courseIds },
        "quiz.attempted": true,
      }),

      getInstructorRevenue(courseIds),
    ]);

  const avgRating =
    instructorCourses.reduce((acc, c) => acc + (c.rating || 0), 0) /
    (instructorCourses.length || 1);

  return {
    totalCourses,
    totalStudents: studentsAgg[0]?.total || 0,
    publishedLessons: lessons,
    quizAttempts,
    revenueEarned: revenueAgg,
    courseRating: Number(avgRating.toFixed(2)),
  };
};
export const getStudentKPIs = async (studentId) => {
  const student = await Student.findOne({ user: studentId }).lean();

  if (!student) return null;

  const enrolled = student.enrolledCourses || [];

  const totalCourses = enrolled.length;
  const completedCourses = enrolled.filter((c) => c.completed).length;

  const certificates = student.certificates?.length || 0;

  const avgProgress =
    enrolled.reduce((acc, c) => acc + (c.progress || 0), 0) /
    (totalCourses || 1);

  return {
    enrolledCourses: totalCourses,
    completedCourses,
    certificates,
    currentProgress: Number(avgProgress.toFixed(2)),
  };
};

const getInstructorRevenue = async (courseIds) => {
  return Payment.aggregate([
    { $match: { status: "paid" } },

    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    { $unwind: "$order" },

    { $unwind: "$order.items" },

    {
      $match: {
        "order.items.itemId": { $in: courseIds },
      },
    },

    {
      $unwind: "$transactions",
    },

    {
      $group: {
        _id: null,
        total: { $sum: "$transactions.amount" },
      },
    },
  ]).then((r) => r[0]?.total || 0);
};
export const getInstructorTopCourses = (courseIds) =>
  LessonProgress.aggregate([
    { $match: { course: { $in: courseIds } } },

    {
      $group: {
        _id: "$course",
        students: { $addToSet: "$student" },
      },
    },

    {
      $project: {
        totalStudents: { $size: "$students" },
      },
    },

    { $sort: { totalStudents: -1 } },
    { $limit: 5 },

    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
  ]);
export const getLearningAnalytics = (courseIds) =>
  LessonProgress.aggregate([
    {
      $match: { course: { $in: courseIds } },
    },

    {
      $group: {
        _id: null,

        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },

        total: { $sum: 1 },

        avgProgress: {
          $avg: "$progress.percent",
        },

        quizSuccess: {
          $sum: {
            $cond: ["$quiz.passed", 1, 0],
          },
        },

        quizTotal: {
          $sum: {
            $cond: ["$quiz.attempted", 1, 0],
          },
        },
      },
    },
  ]);
export const getRevenueTrend = async () => {
  return Payment.aggregate([
    { $match: { status: "paid" } },

    {
      $unwind: "$transactions",
    },

    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$transactions.amount" },
      },
    },

    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};
export const getUserGrowth = async () => {
  return User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: { $toDate: "$createdAt" } },
          month: { $month: { $toDate: "$createdAt" } },
        },
        users: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};
export const getCourseGrowth = async () => {
  return Course.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        courses: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};
export const getTopCourses = async () => {
  return LessonProgress.aggregate([
    {
      $group: {
        _id: "$course",
        students: { $addToSet: "$student" },
      },
    },
    {
      $project: {
        course: "$_id",
        totalStudents: { $size: "$students" },
      },
    },
    { $sort: { totalStudents: -1 } },
    { $limit: 5 },

    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
  ]);
};
export const getRecentOrders = () =>
  Order.find()
    .populate("userId", "fullname email")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
export const getRecentUsers = () =>
  User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("fullname email createdAt")
    .lean();

export const getRecentAuditLogs = () =>
  AuditLog.find().sort({ updatedAt: -1 }).limit(5).lean();
export const getReportedComments = () =>
  Comment.find({ report_count: { $gt: 0 } })
    .sort({ report_count: -1 })
    .limit(5)
    .lean();
export const getActiveChats = () =>
  ChatRoom.find().sort({ updated_at: -1 }).limit(5).lean();

export const getRecentEnrollments = (courseIds) =>
  LessonProgress.find({
    course: { $in: courseIds },
  })
    .populate("student", "fullname email")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
export const getRecentQuizAttempts = (courseIds) =>
  LessonProgress.find({
    course: { $in: courseIds },
    "quiz.attempted": true,
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();
export const getRecentComments = (courseIds) =>
  Comment.find({
    targetType: "course",
    targetId: { $in: courseIds },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
export const getContinueLearning = async (studentId) => {
  const student = await Student.findOne({ user: studentId })
    .populate("enrolledCourses.course", "title slug coverImage")
    .lean();

  return (student.enrolledCourses || [])
    .filter((c) => c.lastAccessed)
    .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
    .slice(0, 5);
};
export const getStudentProgressChart = (studentObjectId) =>
  LessonProgress.aggregate([
    {
      $match: {
        student: studentObjectId,
      },
    },
    {
      $group: {
        _id: "$course",
        totalLessons: { $sum: 1 },
        completedLessons: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        course: "$_id",
        progress: {
          $multiply: [{ $divide: ["$completedLessons", "$totalLessons"] }, 100],
        },
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
  ]);
export const getStudentNotifications = (userId) =>
  UserNotification.find({ userId }).sort({ updatedAt: -1 }).limit(5).lean();
export const getUpcomingQuizzes = (courseIds) =>
  Quiz.find({
    course: { $in: courseIds },
    isPublished: true,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
export const getBookmarks = async (studentId) => {
  const student = await Student.findOne({ user: studentId })
    .populate("bookmarks.course", "title slug coverImage")
    .lean();

  return student.bookmarks.slice(0, 5);
};
export const getStudentComments = (studentUserId) =>
  Comment.find({ authorId: studentUserId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
