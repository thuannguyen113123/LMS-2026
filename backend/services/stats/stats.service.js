import Course from "../../models/courses/Course.js";
import User from "../../models/user/user.model.js";
import Instructor from "../../models/instructor/instructor.model.js";
import Student from "../../models/student/student.model.js";
import LessonProgress from "../../models/lessonProgress/lessonProgress.model.js";

import { getTopCourses } from "../dashboard/dashboard.aggregate.js";

export const mapHeroStats = (data) => ({
  courses: data.courses || 0,
  students: data.students || 0,
  instructors: data.instructors || 0,
  completionRate: Number((data.completionRate || 0).toFixed(1)),
});
export const mapHighlightStats = (data) => ({
  completedCourses: data.completedCourses || 0,
  satisfactionRate: Number((data.satisfactionRate || 0).toFixed(1)),
  careerAdvancementRate: Number((data.careerAdvancementRate || 0).toFixed(1)),
});
const mapTopCourse = (course) => ({
  id: course.course._id,
  title: course.course.title,
  thumbnail: course.course.coverImage,
  rating: course.course.averageRating || 0,
  totalStudents: course.totalStudents,
  instructorName: course.course.instructorName || "Instructor",
});

const getCompletionRate = async () => {
  const result = await LessonProgress.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const total = result[0]?.total || 0;
  const completed = result[0]?.completed || 0;

  if (!total) return 0;

  return (completed / total) * 100;
};
const getCompletedCourses = async () => {
  return LessonProgress.aggregate([
    {
      $match: { status: "completed" },
    },
    {
      $group: {
        _id: "$course",
      },
    },
    {
      $count: "total",
    },
  ]).then((r) => r[0]?.total || 0);
};

const getSatisfactionRate = async () => {
  const result = await Course.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$averageRating" },
      },
    },
  ]);

  const rating = result[0]?.avgRating || 0;

  return (rating / 5) * 100;
};
const getCareerAdvancementRate = async () => {
  const result = await LessonProgress.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const total = result[0]?.total || 0;
  const completed = result[0]?.completed || 0;

  if (!total) return 0;

  return (completed / total) * 100;
};
const getCourseGrowth = async () => {
  return Course.aggregate([
    {
      $match: { status: "published" },
    },
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

const mapAboutStats = (data) => ({
  totalCourses: data.totalCourses || 0,
  courseGrowth: data.courseGrowth || [],
});

const StatsService = {
  async getHeroStatsUseCase() {
    const [
      publishedCourses,
      totalUsers,
      totalInstructors,
      totalStudents,
      completionRate,
      topCourses,
    ] = await Promise.all([
      Course.countDocuments({ status: "published" }),
      User.countDocuments(),
      Instructor.countDocuments(),
      Student.countDocuments(),
      getCompletionRate(),
      getTopCourses(),
    ]);

    const stats = mapHeroStats({
      courses: publishedCourses,
      students: totalStudents,
      instructors: totalInstructors,
      completionRate,
    });

    const topCourse = topCourses?.[0] ? mapTopCourse(topCourses[0]) : null;

    return {
      stats,
      topCourse,
    };
  },
  async getHighlightStatsUseCase() {
    const [completedCourses, satisfactionRate, careerAdvancementRate] =
      await Promise.all([
        getCompletedCourses(),
        getSatisfactionRate(),
        getCareerAdvancementRate(),
      ]);

    return mapHighlightStats({
      completedCourses,
      satisfactionRate,
      careerAdvancementRate,
    });
  },
  async getAboutStatsUseCase() {
    const [totalCourses, courseGrowth] = await Promise.all([
      Course.countDocuments({ status: "published" }),
      getCourseGrowth(),
    ]);

    return mapAboutStats({
      totalCourses,
      courseGrowth,
    });
  },
};

export default StatsService;
