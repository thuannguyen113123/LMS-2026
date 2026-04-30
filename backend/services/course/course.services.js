import Course from "../../models/courses/Course.js";
import Category from "../../models/category/Category.js";
import Student from "../../models/student/student.model.js";

import ChatRoom from "../../models/chat/chatRoom.model.js";
import Instructor from "../../models/instructor/instructor.model.js";
import LessonProgress from "../../models/lessonProgress/lessonProgress.model.js";
import Lesson from "../../models/lesson/lesson.model.js";

import User from "../../models/user/user.model.js";
import slugify from "slugify";

import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import { COURSE_CODES } from "../../constants/course.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import { ROLES } from "../../middlewares/auth.js";
import { courseBulkItemSchema } from "../../validators/course/course.validator.js";
import { exportCoursesFile } from "./course.export.js";
import NotificationService, {
  TYPE_SETTING_MAP,
} from "../../services/notification/notification.service.js";

export const mapCourse = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    whatYouWillLearn: doc.whatYouWillLearn,
    audience: doc.audience,
    requirements: doc.requirements,

    coverImage: doc.coverImage,
    videoURL: doc.videoURL,

    price: doc.price,
    discountPrice: doc.discountPrice,
    isFree: doc.isFree,

    duration: doc.duration,
    rating: doc.rating,
    status: doc.status,

    category: doc.category
      ? {
          id: doc.category._id?.toString(),
          name: doc.category.name,
          slug: doc.category.slug,
        }
      : null,

    instructor: doc.instructor
      ? {
          id: doc.instructor._id?.toString(),
          name: doc.instructor?.user?.fullname || null,
        }
      : null,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export const mapContinueLearning = ({
  course,
  progressPercent,
  currentLesson,
  remainingDuration,
}) => {
  return {
    id: course._id.toString(),
    slug: course.slug,
    title: course.title,
    instructor: course?.instructor?.fullname || "Unknown",
    progress: progressPercent,
    currentLesson: currentLesson?.title || "Start learning",
    durationLeft: remainingDuration,
    cover: course.coverImage,
  };
};
// course.mapper.js
export const mapCourseDetail = (doc, flags = {}) => {
  if (!doc) return null;

  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    title: doc.title,
    slug: doc.slug,
    description: doc.description,

    whatYouWillLearn: doc.whatYouWillLearn,
    audience: doc.audience,
    requirements: doc.requirements,

    coverImage: doc.coverImage,
    videoURL: doc.videoURL,

    price: doc.price,
    discountPrice: doc.discountPrice,
    isFree: doc.isFree,

    duration: doc.duration,
    rating: doc.rating,
    status: doc.status,

    category: doc.category
      ? {
          id: doc.category._id?.toString(),
          name: doc.category.name,
          slug: doc.category.slug,
        }
      : null,

    instructor: doc.instructor
      ? {
          id: doc.instructor._id?.toString(),
          slug: doc.instructor.slug,
          bio: doc.instructor.bio,
          expertise: doc.instructor.expertise,
          rating: doc.instructor.rating,
          totalStudents: doc.instructor.totalStudents,

          user: doc.instructor.user
            ? {
                fullname: doc.instructor.user.fullname,

                email: doc.instructor.user.email,
              }
            : null,
        }
      : null,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,

    // flags
    isEnrolled: flags.isEnrolled || false,
    isPurchased: flags.isPurchased || false,
    canAccess: flags.canAccess || false,
  };
};

export const mapMyCourse = ({ course, enroll, currentLessonProgress }) => {
  let currentLessonTitle = "Start learning";
  let durationLeft = 0;

  if (currentLessonProgress) {
    // Nếu đang học bài nào đó
    currentLessonTitle =
      currentLessonProgress.lesson?.title || "Continue learning";

    // convert duration (seconds → minutes)
    if (currentLessonProgress.progress?.duration) {
      const durationSec = currentLessonProgress.progress.duration;
      const currentTime = currentLessonProgress.progress.currentTime || 0;
      durationLeft = Math.ceil((durationSec - currentTime) / 60);
    }
  }

  return {
    id: course._id.toString(),
    slug: course.slug,
    title: course.title,
    instructor: course?.instructor?.user?.fullname || "Unknown",
    cover: course.coverImage,
    progress: enroll?.progress || 0,
    completed: enroll?.completed || false,
    lastAccessed: enroll?.lastAccessed || null,
    currentLesson: currentLessonTitle,
    durationLeft,
    createdAt: course.createdAt,
  };
};
export function parseCourseQuery(query) {
  return {
    category: query.category || null,
    instructor: query.instructor || null,
    search: query.search?.trim() || "",
    price: query.price || "all",
    rating: query.rating ? Number(query.rating) : null,
    sort: query.sort || "latest",
  };
}

export const applyMyCourseFilter = (data, type) => {
  switch (type) {
    case "in_progress":
      return data.filter((c) => c.progress > 0 && c.progress < 100);

    case "completed":
      return data.filter((c) => c.progress === 100);

    default:
      return data;
  }
};

export const sortMyCourses = (data, sort) => {
  switch (sort) {
    case "progress":
      return data.sort((a, b) => b.progress - a.progress);

    case "title":
      return data.sort((a, b) => a.title.localeCompare(b.title));

    case "recent":
      return data.sort(
        (a, b) => new Date(b.lastAccessed || 0) - new Date(a.lastAccessed || 0)
      );

    default:
      return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

export const buildMyCoursesQuery = ({
  enrolledCourseIds,
  query,
  cursorDoc,
}) => {
  const filter = {
    _id: { $in: enrolledCourseIds },
    status: "published",
  };

  if (query.search?.trim()) {
    filter.title = {
      $regex: query.search.trim(),
      $options: "i",
    };
  }

  if (cursorDoc) {
    filter.$or = [
      { createdAt: { $lt: cursorDoc.createdAt } },
      {
        createdAt: cursorDoc.createdAt,
        _id: { $lt: cursorDoc._id },
      },
    ];
  }

  return filter;
};

export const validateCourseExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      COURSE_CODES.COURSE_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      COURSE_CODES.COURSE_EXPORT_SELECTED_EMPTY,
      "Chưa chọn khóa học để export",
      400
    );
  }
};

export const validateCourseExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      COURSE_CODES.COURSE_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";
export function applyCourseTypeFilter(filter, type) {
  switch (type) {
    case "new":
      filter.createdAt = {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
      break;

    case "discount":
      filter.discountPrice = { $exists: true };
      break;

    case "top":
      filter.rating = { $gte: 4.5 };
      break;
  }

  return filter;
}
export function buildCourseSort({ sort }) {
  switch (sort) {
    case "price_asc":
      return { price: 1, _id: 1 };

    case "price_desc":
      return { price: -1, _id: -1 };

    case "rating_desc":
      return { rating: -1, _id: -1 };

    case "latest":
      return { createdAt: -1, _id: -1 };
    case "default":
      return { createdAt: -1, _id: -1 };

    default:
      return { createdAt: -1, _id: -1 };
  }
}

export async function buildCourseFilter({ query, role, userId, isPublic }) {
  const parsed = parseCourseQuery(query);
  const filter = {};

  if (isPublic) {
    filter.status = "published";
  }

  // ===== ROLE =====
  if (!isPublic && role === "instructor") {
    const instructorDoc = await Instructor.findOne({ user: userId }).lean();

    filter.instructor = instructorDoc?._id || null;

    if (query.status) {
      const statuses = Array.isArray(query.status)
        ? query.status
        : [query.status];

      filter.status = {
        $in: statuses.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
      };
    }
  }

  if (!isPublic && role === "student") {
    filter.status = "published";
  }

  // ===== CATEGORY =====
  if (parsed.category && parsed.category !== "all") {
    const category = await Category.findOne({
      slug: parsed.category,
    }).lean();

    if (category) {
      filter.category = category._id;
    }
  }

  // ===== INSTRUCTOR =====
  if (parsed.instructor) {
    let instructorId = null;

    // check ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(parsed.instructor);

    if (isObjectId) {
      instructorId = parsed.instructor;
    } else {
      const instructorDoc = await Instructor.findOne({
        slug: parsed.instructor,
      })
        .select("_id slug")
        .lean();

      instructorId = instructorDoc?._id || null;
    }

    if (!instructorId) {
      filter._id = null;
    } else {
      filter.instructor = instructorId;
    }
  }

  // ===== SEARCH =====
  if (parsed.search) {
    filter.title = {
      $regex: parsed.search,
      $options: "i",
    };
  }

  // ===== PRICE =====
  if (parsed.price === "free") filter.isFree = true;
  if (parsed.price === "paid") filter.isFree = false;

  // ===== RATING =====
  if (parsed.rating) {
    filter.rating = { $gte: parsed.rating };
  }

  return filter;
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const CourseModel = {
  async createCourse(data, user) {
    try {
      const title = data.title?.trim();

      if (!title) {
        throw new AppError(
          COURSE_CODES.COURSE_CREATE_FAILED,
          "Tiêu đề khóa học không hợp lệ",
          400
        );
      }

      //  role rule — dồn về service
      if (user.role === ROLES.INSTRUCTOR) {
        const instructorDoc = await Instructor.findOne({ user: user.id });

        if (!instructorDoc) {
          throw new AppError(
            "INSTRUCTOR_NOT_FOUND",
            "Không tìm thấy instructor",
            400
          );
        }

        data.instructor = instructorDoc._id;
      }

      if (user.role === ROLES.ADMIN && !data.instructor) {
        throw new AppError(
          COURSE_CODES.COURSE_INSTRUCTOR_REQUIRED,
          "Admin phải cung cấp instructor",
          400
        );
      }

      // duplicate check theo slug (nên có)
      if (data.slug) {
        const existed = await Course.findOne({ slug: data.slug });
        if (existed) {
          throw new AppError(
            COURSE_CODES.COURSE_EXISTS,
            "Khóa học đã tồn tại",
            409
          );
        }
      }

      const created = await Course.create({
        ...data,
        title,
      });

      // audit log trong service
      await saveAuditLogs({
        entityType: "courses",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: {
          title: created.title,
          slug: created.slug,
          price: created.price,
          status: created.status,
        },
        updatedBy: user?.id || user?._id,
      });

      await NotificationService.broadcastToStudents({
        type: TYPE_SETTING_MAP.COURSE_NEW,
        title: "Khóa học mới",
        message: `Khóa học "${created.title}" vừa được phát hành`,
        entityId: created._id,
        entityType: "Course",
      });

      // trả mapDoc
      return mapCourse(created);
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error("CreateCourse service error:", err);

      throw err;
    }
  },

  async bulkCreateCourses(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        COURSE_CODES.COURSE_BULK_INVALID_PAYLOAD,
        "Danh sách course không hợp lệ"
      );
    }

    const validItems = [];
    const errors = [];

    // validate từng dòng
    inputList.forEach((item, index) => {
      const { error, value } = courseBulkItemSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          code: COURSE_CODES.COURSE_BULK_VALIDATION_FAILED,
          title: item?.title || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // duplicate title trong file
    const seen = new Set();
    const uniqueValid = [];

    validItems.forEach((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) {
        errors.push({
          code: COURSE_CODES.COURSE_BULK_DUPLICATE_IN_FILE,
          title: item.title,
          reason: ["Trùng title trong file import"],
        });
      } else {
        seen.add(key);
        uniqueValid.push(item);
      }
    });

    // map categoryName → categoryId
    const categoryNames = [
      ...new Set(uniqueValid.map((i) => i.categoryName.toLowerCase())),
    ];

    const categories = await Category.find({
      name: {
        $in: categoryNames.map((n) => new RegExp(`^${n}$`, "i")),
      },
    })
      .select("_id name")
      .lean();

    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c._id])
    );

    // map instructorName → instructorId (chuẩn theo schema ref User)

    const instructorNames = [
      ...new Set(
        uniqueValid
          .filter((i) => i.instructorName)
          .map((i) => i.instructorName.toLowerCase())
      ),
    ];

    let instructorMap = new Map();

    if (instructorNames.length > 0) {
      // tìm user theo fullname
      const users = await User.find({
        fullname: {
          $in: instructorNames.map((n) => new RegExp(`^${n}$`, "i")),
        },
      })
        .select("_id fullname")
        .lean();

      const userIdSet = users.map((u) => u._id);

      // tìm instructor theo userId
      const instructors = await Instructor.find({
        user: { $in: userIdSet },
      })
        .select("_id user")
        .lean();

      const userNameMap = new Map(
        users.map((u) => [u._id.toString(), u.fullname.toLowerCase()])
      );

      instructorMap = new Map(
        instructors.map((ins) => [
          userNameMap.get(ins.user.toString()),
          ins._id,
        ])
      );
    }

    const mappedItems = [];

    // map FK + build item create
    uniqueValid.forEach((item, index) => {
      const categoryId = categoryMap.get(item.categoryName.toLowerCase());

      if (!categoryId) {
        errors.push({
          index,
          code: COURSE_CODES.COURSE_CATEGORY_NOT_FOUND,
          title: item.title,
          reason: [`Category "${item.categoryName}" không tồn tại`],
        });
        return;
      }

      let instructorId = null;

      if (item.instructorName) {
        instructorId = instructorMap.get(item.instructorName.toLowerCase());

        if (!instructorId) {
          errors.push({
            index,
            code: COURSE_CODES.COURSE_INSTRUCTOR_NOT_FOUND,
            title: item.title,
            reason: [`Instructor "${item.instructorName}" không tồn tại`],
          });
          return;
        }
      }

      mappedItems.push({
        title: item.title,
        description: item.description,
        price: item.price,
        discountPrice: item.discountPrice,
        status: item.status,
        category: categoryId,
        instructor: instructorId,
        createdBy: updatedBy,
        updatedBy,
      });
    });

    // check trùng DB theo slug
    const slugs = mappedItems.map((i) =>
      slugify(i.title, { lower: true, strict: true })
    );

    const existing = await Course.find({ slug: { $in: slugs } })
      .select("slug")
      .lean();

    const existSet = new Set(existing.map((e) => e.slug));

    const toCreate = [];
    const skipped = [];

    mappedItems.forEach((item) => {
      const slug = slugify(item.title, { lower: true, strict: true });

      if (existSet.has(slug)) {
        skipped.push({
          code: COURSE_CODES.COURSE_ALREADY_EXISTS,
          title: item.title,
        });
      } else {
        toCreate.push(item);
      }
    });

    // không insertMany rỗng
    if (toCreate.length === 0) {
      return {
        created: [],
        skipped,
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          skipped: skipped.length,
          failed: errors.length,
        },
      };
    }

    // insert
    const createdDocs = await Course.insertMany(toCreate, {
      ordered: false,
    });

    // audit log
    await Promise.all(
      createdDocs.map((c) =>
        saveAuditLogs({
          entityType: "courses",
          entityId: c._id,
          oldData: {},
          newData: mapCourse(c),
          updatedBy,
        })
      )
    );

    return {
      created: createdDocs.map(mapCourse),
      skipped,
      errors,
      summary: {
        total: inputList.length,
        created: createdDocs.length,
        skipped: skipped.length,
        failed: errors.length,
      },
    };
  },
  async listAdminCoursesUseCase({ query, role, userId }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = await buildCourseFilter({
      query,
      role,
      userId,
    });

    const sort = buildCourseSort({
      sort: query.sort,
    });

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("category", "name slug")
        .populate({
          path: "instructor",
          populate: {
            path: "user",
            select: "fullname",
          },
        })
        .lean(),

      Course.countDocuments(filter),
    ]);

    return {
      data: courses.map(mapCourse),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async listPublicCoursesUseCase({ query }) {
    const limit = Number(query.limit) || 12;
    const cursor = query.cursor;

    let filter = await buildCourseFilter({
      query,
      isPublic: true,
    });

    const sort = buildCourseSort({
      sort: query.sort,
    });

    if (cursor) {
      const cursorDoc = await Course.findById(cursor).select("createdAt");

      if (cursorDoc) {
        filter.$or = [
          { createdAt: { $lt: cursorDoc.createdAt } },
          {
            createdAt: cursorDoc.createdAt,
            _id: { $lt: cursor },
          },
        ];
      }
    }

    const docs = await Course.find(filter)
      .sort(sort)
      .limit(limit + 1)
      .populate("category", "name slug")
      .populate({
        path: "instructor",
        populate: {
          path: "user",
          select: "fullname",
        },
      })
      .lean();

    const hasNext = docs.length > limit;
    if (hasNext) docs.pop();

    const data = docs.map(mapCourse);

    return {
      data,
      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },
  async getCourseOptions({ role, userId }) {
    try {
      let filter = {
        status: "published",
      };

      if (role === ROLES.INSTRUCTOR) {
        const instructorDoc = await Instructor.findOne({ user: userId })
          .select("_id")
          .lean();

        // nếu không có instructor → trả rỗng luôn
        if (!instructorDoc) return [];

        filter.instructor = instructorDoc._id;
      }

      const docs = await Course.find(filter)
        .select("_id title slug")
        .sort({ title: 1 })
        .lean();

      return docs.map((doc) => ({
        id: doc._id.toString(),
        name: doc.title,
        slug: doc.slug,
      }));
    } catch (err) {
      console.error("getCourseOptions error:", err);

      throw new AppError(
        COURSE_CODES.COURSE_LIST_FAILED,
        "Không thể lấy course options",
        500
      );
    }
  },
  //My course
  async listMyCoursesUseCase({ query, userId }) {
    const limit = Number(query.limit) || 8;
    const cursor = query.cursor;

    // Get student
    const studentDoc = await Student.findOne({ user: userId })
      .select("enrolledCourses")
      .lean();

    if (!studentDoc?.enrolledCourses?.length) {
      return {
        data: [],
        pagination: { nextCursor: null, hasNext: false },
      };
    }

    const enrolled = studentDoc.enrolledCourses;
    const enrolledMap = new Map(enrolled.map((e) => [e.course.toString(), e]));
    const enrolledCourseIds = enrolled.map((e) => e.course);

    //  Cursor doc
    let cursorDoc = null;
    if (cursor) {
      cursorDoc = await Course.findById(cursor).select("createdAt _id");
    }

    //  Build query
    const filter = buildMyCoursesQuery({ enrolledCourseIds, query, cursorDoc });

    //  Query DB
    let courses = await Course.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: "instructor",
        populate: { path: "user", select: "fullname" },
      })
      .lean();

    const hasNext = courses.length > limit;
    if (hasNext) courses.pop();

    //  Lấy lessons và lessonProgress
    const courseIds = courses.map((c) => c._id);
    const lessons = await Lesson.find({ course: { $in: courseIds } })
      .sort({ order: 1 })
      .lean();

    const lessonsMap = new Map();
    lessons.forEach((lesson) => {
      const arr = lessonsMap.get(lesson.course.toString()) || [];
      arr.push(lesson);
      lessonsMap.set(lesson.course.toString(), arr);
    });

    const lessonProgressDocs = await LessonProgress.find({
      student: userId,
      course: { $in: courseIds },
    }).lean();

    const progressMap = new Map();
    lessonProgressDocs.forEach((lp) => {
      const arr = progressMap.get(lp.course.toString()) || [];
      arr.push(lp);
      progressMap.set(lp.course.toString(), arr);
    });

    //  Map courses với mapMyCourse
    const data = courses.map((course) => {
      const enroll = enrolledMap.get(course._id.toString());
      const courseLessons = lessonsMap.get(course._id.toString()) || [];
      const courseProgress = progressMap.get(course._id.toString()) || [];

      // Tìm lesson đang học tiếp theo (currentLessonProgress)
      let currentLessonProgress = null;

      for (const lesson of courseLessons) {
        const lp = courseProgress.find(
          (p) => p.lesson.toString() === lesson._id.toString()
        );

        if (!lp || lp.status === "not_started") {
          currentLessonProgress = {
            lesson,
            progress: { duration: lesson.duration, currentTime: 0 },
          };
          break;
        }

        if (lp.status === "in_progress" || lp.status === "quiz_pending") {
          currentLessonProgress = lp;
          break;
        }
      }

      return mapMyCourse({ course, enroll, currentLessonProgress });
    });

    //  Filter + Sort + Pagination
    const filtered = applyMyCourseFilter(data, query.type);
    const sorted = sortMyCourses(filtered, query.sort);

    return {
      data: sorted.map(({ createdAt, ...rest }) => rest),
      pagination: {
        nextCursor: hasNext ? sorted[sorted.length - 1]?.id : null,
        hasNext,
      },
    };
  },
  async publishCourse(courseId, actor) {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new AppError(
        COURSE_CODES.COURSE_NOT_FOUND,
        "Không tìm thấy khóa học",
        404
      );
    }

    if (course.status === "published") {
      return {
        code: COURSE_CODES.COURSE_ALREADY_PUBLISHED,
        course: mapCourse(course),
      };
    }

    const oldData = mapCourse(course);

    // update
    course.status = "Published";
    course.publishedAt = new Date();
    course.updatedBy = actor?.id || actor?._id;
    await course.save();

    // create chat room nếu chưa có
    const existedRoom = await ChatRoom.findOne({
      type: "course",
      course_id: course._id,
    });

    if (!existedRoom) {
      await ChatRoom.create({
        type: "course",
        name: course.title,
        course_id: course._id,
        user_ids: [course.instructor],
        admins: [course.instructor],
      });
    }

    // audit log
    await saveAuditLogs({
      entityType: "courses",
      entityId: course._id,
      action: "publish",
      oldData,
      newData: { status: "Published" },
      updatedBy: actor?.id || actor?._id,
    });

    return {
      code: COURSE_CODES.COURSE_PUBLISH_SUCCESS,
      course: mapCourse(course),
    };
  },
  // Lấy khóa học đề xuất
  async getRecommendedCourses({ courseId, userId, limit = 4 }) {
    const currentCourse = await Course.findById(courseId).lean();
    if (!currentCourse) return [];

    const query = {
      _id: { $ne: courseId },
      category: currentCourse.category,
      status: "published",
    };

    // Nếu có user → loại khóa đã mua
    if (userId) {
      const purchasedCourseIds = await Order.distinct("items.productId", {
        user: userId,
        status: "paid",
      });

      query._id.$nin = purchasedCourseIds;
    }

    const docs = await Course.find(query)
      .sort({
        rating: -1,
        totalStudents: -1,
      })
      .limit(limit)
      .select(
        `
      title
      slug
      coverImage
      price
      discountPrice
      rating
      totalStudents
      isFree
    `
      )
      .populate("category", "name slug")
      .populate({
        path: "instructor",
        populate: {
          path: "user",
          select: "fullname",
        },
      })
      .lean();

    return docs.map(mapCourse);
  },
  async getCourseDetail(slug, user) {
    try {
      if (!slug) {
        throw new AppError(
          COURSE_CODES.COURSE_INVALID_SLUG,
          "Slug không hợp lệ",
          400
        );
      }

      // 1. find course
      let course = await Course.findOne({ slug })
        .populate({
          path: "category",
          select: "name slug",
        })
        .populate({
          path: "instructor",
          select: "slug bio expertise rating totalStudents user",
          populate: {
            path: "user",
            select: "fullname email",
          },
        });

      if (!course) {
        throw new AppError(
          COURSE_CODES.COURSE_NOT_FOUND,
          "Không tìm thấy khóa học",
          404
        );
      }

      // 2. attach instructor nếu thiếu
      if (!course.instructor) {
        const instructor = await Instructor.findOne({
          "coursesTaught.course": course._id,
        }).populate({
          path: "user",
          select: "fullname avatar email",
        });

        if (instructor) {
          course.instructor = instructor._id;
          await course.save();

          course = await Course.findById(course._id).populate([
            {
              path: "category",
              select: "name slug",
            },
            {
              path: "instructor",
              select: "slug bio expertise rating totalStudents user",
              populate: {
                path: "user",
                select: "fullname avatar email",
              },
            },
          ]);
        }
      }

      let isEnrolled = false;
      let isPurchased = false;

      const userId = user?.id || user?._id;

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const student = await Student.findOne({
          user: new mongoose.Types.ObjectId(userId),
        });

        if (student) {
          isEnrolled = student.enrolledCourses.some(
            (e) => e.course.toString() === course._id.toString()
          );
        }
      }

      const canAccess = isEnrolled || isPurchased;

      const mapped = mapCourseDetail(course, {
        isEnrolled,
        isPurchased,
        canAccess,
      });

      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("getCourseDetail service error:", err);
      throw err;
    }
  },

  async updateCourse(id, data, user) {
    try {
      if (!id) {
        throw new AppError(
          COURSE_CODES.COURSE_ID_REQUIRED,
          "Thiếu id khóa học",
          400
        );
      }

      // check tồn tại
      const oldDoc = await Course.findById(id);
      if (!oldDoc) {
        throw new AppError(
          COURSE_CODES.COURSE_NOT_FOUND,
          "Không tìm thấy khóa học",
          404
        );
      }

      const oldMapped = mapCourse(oldDoc);

      // chuẩn hóa dữ liệu update
      const updateData = { ...data };

      if (updateData.title) {
        updateData.title = updateData.title.trim();
      }

      //  rule role — instructor không được sửa instructor khác
      if (user.role === ROLES.INSTRUCTOR) {
        const instructorDoc = await Instructor.findOne({ user: user.id });

        if (!instructorDoc) {
          throw new AppError(
            "INSTRUCTOR_NOT_FOUND",
            "Không tìm thấy instructor"
          );
        }

        updateData.instructor = instructorDoc._id;
      }

      // admin update instructor thì OK — nhưng nếu gửi null → reject
      if (user.role === ROLES.ADMIN && updateData.instructor === null) {
        throw new AppError(
          COURSE_CODES.COURSE_INSTRUCTOR_REQUIRED,
          "Instructor không hợp lệ",
          400
        );
      }

      // check slug duplicate nếu có update slug
      if (updateData.slug && updateData.slug !== oldDoc.slug) {
        const existed = await Course.findOne({
          slug: updateData.slug,
          _id: { $ne: id },
        });

        if (existed) {
          throw new AppError(
            COURSE_CODES.COURSE_EXISTS,
            "Slug khóa học đã tồn tại",
            409
          );
        }
      }

      // gắn updatedBy
      updateData.updatedBy = user.id || user._id;

      // update
      const updatedDoc = await Course.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      const mapped = mapCourse(updatedDoc);

      // audit log trong service
      await saveAuditLogs({
        entityType: "courses",
        entityId: id,
        action: "update",
        oldData: oldMapped,
        newData: mapped,
        updatedBy: getUserIdentifier(user),
      });

      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("updateCourse service error:", err);

      throw new AppError(
        COURSE_CODES.COURSE_UPDATE_FAILED,
        "Không thể cập nhật khóa học",
        500
      );
    }
  },

  async removeManyCourses(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        COURSE_CODES.COURSE_DELETE_EMPTY_IDS,
        "Không có khóa học để xóa",
        400
      );
    }

    // lấy data cũ
    const courses = await Course.find({ _id: { $in: ids } });

    if (courses.length !== ids.length) {
      const foundIds = courses.map((c) => c._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        COURSE_CODES.COURSE_NOT_FOUND,
        `Không tìm thấy khóa học: ${notFoundIds.join(", ")}`,
        404
      );
    }

    const mappedOld = courses.map(mapCourse);

    // delete
    await Course.deleteMany({ _id: { $in: ids } });

    // audit log — nằm trong service
    await Promise.all(
      courses.map((course, index) =>
        saveAuditLogs({
          entityType: "courses",
          entityId: course._id,
          action: "delete",
          oldData: mappedOld[index],
          newData: {},
          updatedBy: actor?.id || actor?._id,
        })
      )
    );

    return {
      deletedIds: ids,
      deletedCount: ids.length,
    };
  },
  async getCoursesForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.title = { $regex: filters.search, $options: "i" };
    }

    if (
      filters?.category &&
      filters.category !== "All" &&
      mongoose.Types.ObjectId.isValid(filters.category)
    ) {
      query.category = filters.category;
    }

    if (Array.isArray(filters?.status) && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Course.find(query)
      .populate("category", "name")
      .populate("instructor", "fullname")
      .sort({ createdAt: -1 })
      .lean();
  },
  async previewExportCourses({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateCourseExportScope({ scope, selectedIds });

    const courses = await this.getCoursesForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!courses.length) {
      throw new AppError(
        COURSE_CODES.COURSE_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = courses.map(mapCourse);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },
  async exportCourses({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateCourseExportScope({ scope, selectedIds });
    validateCourseExportFormat(format);

    const courses = await this.getCoursesForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!courses.length) {
      throw new AppError(
        COURSE_CODES.COURSE_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportCoursesFile({
      courses,
      format,
    });

    // optional audit log
    await saveAuditLogs({
      entityType: "courses",
      action: "export",
      entityId: null,
      oldData: {},
      newData: { count: courses.length, format },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `courses_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
  async getContinueLearning(studentId) {
    const result = await LessonProgress.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          lastAccessedAt: { $ne: null },
        },
      },

      {
        $group: {
          _id: "$course",

          lessons: { $push: "$$ROOT" },

          totalPercent: {
            $sum: { $ifNull: ["$progress.percent", 0] },
          },

          lastAccessedAt: { $max: "$lastAccessedAt" },
        },
      },

      {
        $lookup: {
          from: "lessons",
          let: { courseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$course", "$$courseId"] },
                isPublished: true,
              },
            },
            { $count: "totalLessons" },
          ],
          as: "lessonMeta",
        },
      },

      {
        $addFields: {
          totalLessons: {
            $ifNull: [{ $arrayElemAt: ["$lessonMeta.totalLessons", 0] }, 1],
          },
        },
      },

      {
        $addFields: {
          progressPercent: {
            $round: [
              {
                $divide: ["$totalPercent", "$totalLessons"],
              },
              0,
            ],
          },
        },
      },

      {
        $match: {
          progressPercent: { $lt: 100 },
        },
      },

      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },

      { $unwind: "$course" },

      /* instructor */
      {
        $lookup: {
          from: "instructors",
          localField: "course.instructor",
          foreignField: "_id",
          as: "instructor",
        },
      },

      {
        $addFields: {
          "course.instructor": { $arrayElemAt: ["$instructor", 0] },
        },
      },

      {
        $sort: { lastAccessedAt: -1 },
      },
    ]);

    return result.map((item) =>
      mapContinueLearning({
        course: item.course,
        progressPercent: item.progressPercent,
      })
    );
  },
};

export default CourseModel;
