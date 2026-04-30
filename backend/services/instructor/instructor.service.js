import { INSTRUCTOR_CODES } from "../../constants/instructor.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import Instructor from "../../models/instructor/instructor.model.js";
import User from "../../models/user/user.model.js";
import Role from "../../models/role/role.model.js";

import AppError from "../../utils/AppError.js";
import slugify from "slugify";
import { instructorBulkItemSchema } from "../../validators/instructor/instructor.validator.js";
import { exportInstructorsFile } from "./instructor.export.js";
const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";
export const mapInstructor = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    user: doc.user
      ? typeof doc.user === "object"
        ? {
            id: doc.user._id?.toString?.() || doc.user.id,
            fullname: doc.user.fullname,
            email: doc.user.email,
            phone: doc.user.phone,
            avatar: doc.user.avatar,
          }
        : doc.user.toString()
      : null,

    slug: doc.slug,
    bio: doc.bio || "",

    expertise: Array.isArray(doc.expertise) ? doc.expertise : [],

    socialLinks: {
      website: doc.socialLinks?.website || "",
      linkedin: doc.socialLinks?.linkedin || "",
      youtube: doc.socialLinks?.youtube || "",
      github: doc.socialLinks?.github || "",
    },

    coursesTaught: Array.isArray(doc.coursesTaught)
      ? doc.coursesTaught.map((c) => ({
          course:
            typeof c.course === "object"
              ? {
                  id: c.course._id?.toString?.() || c.course.id,
                  title: c.course.title,
                  slug: c.course.slug,
                }
              : c.course?.toString(),

          assignedAt: c.assignedAt || null,
          status: c.status || "active",
        }))
      : [],

    totalStudents: doc.totalStudents ?? 0,

    rating: {
      average: doc.rating?.average ?? 0,
      count: doc.rating?.count ?? 0,
    },

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export const validateInstructorExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      INSTRUCTOR_CODES.INSTRUCTOR_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      INSTRUCTOR_CODES.INSTRUCTOR_EXPORT_SELECTED_EMPTY,
      "Chưa chọn giảng viên để export",
      400
    );
  }
};

export const validateInstructorExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      INSTRUCTOR_CODES.INSTRUCTOR_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
export function buildInstructorFilter(query) {
  const filter = {};

  // SEARCH
  if (query.search?.trim()) {
    const keyword = query.search.trim();

    filter.$or = [
      { slug: { $regex: keyword, $options: "i" } },
      { bio: { $regex: keyword, $options: "i" } },
    ];
  }

  // EXPERTISE
  if (query.expertise && query.expertise !== "all") {
    const expertise = Array.isArray(query.expertise)
      ? query.expertise
      : [query.expertise];

    filter.expertise = { $in: expertise };
  }

  return filter;
}
export function buildInstructorSort(sort) {
  switch (sort) {
    case "rating":
      return { "rating.average": -1, _id: -1 };

    case "students":
      return { totalStudents: -1, _id: -1 };

    case "oldest":
      return { createdAt: 1, _id: 1 };

    case "newest":
    default:
      return { createdAt: -1, _id: -1 };
  }
}

const InstructorService = {
  async createInstructor(data, user) {
    try {
      // ✅ check user tồn tại
      const userDoc = await User.findById(data.user);

      if (!userDoc) {
        throw new AppError(
          INSTRUCTOR_CODES.INSTRUCTOR_USER_NOT_FOUND,
          "Không tìm thấy user",
          404
        );
      }

      // ✅ slug auto từ fullname
      const slug = slugify(userDoc.fullname, {
        lower: true,
        strict: true,
      });

      // ✅ check duplicate instructor theo user
      const existed = await Instructor.findOne({ user: data.user });

      if (existed) {
        throw new AppError(
          INSTRUCTOR_CODES.INSTRUCTOR_EXISTS,
          "User đã là instructor",
          409
        );
      }

      const created = await Instructor.create({
        ...data,
        slug,
        createdBy: user?.id || user?._id,
        updatedBy: user?.id || user?._id,
      });
      const instructorRole = await Role.findOne({ name: "instructor" });

      if (instructorRole) {
        await User.findByIdAndUpdate(data.user, {
          $addToSet: { role_ids: instructorRole._id },
        });
      }
      // ✅ audit log trong service (giống course)
      await saveAuditLogs({
        entityType: "instructors",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: mapInstructor(created),
        updatedBy: user?.id || user?._id,
      });

      // ✅ return mapped data
      return mapInstructor(created);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateInstructor service error:", err);

      throw err;
    }
  },

  async bulkCreateInstructors(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        INSTRUCTOR_CODES.INSTRUCTOR_BULK_INVALID_PAYLOAD,
        "Danh sách instructor không hợp lệ"
      );
    }

    const validItems = [];
    const errors = [];

    // 1️⃣ validate schema từng dòng (bulk schema)
    inputList.forEach((item, index) => {
      const { error, value } = instructorBulkItemSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          code: INSTRUCTOR_CODES.INSTRUCTOR_BULK_VALIDATION_FAILED,
          email: item?.userEmail || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // 2️⃣ duplicate email trong file
    const seenEmail = new Set();
    const uniqueValid = [];

    validItems.forEach((item) => {
      const key = item.userEmail.toLowerCase();

      if (seenEmail.has(key)) {
        errors.push({
          code: INSTRUCTOR_CODES.INSTRUCTOR_DUPLICATE_IN_FILE,
          email: item.userEmail,
          reason: ["Trùng userEmail trong file import"],
        });
      } else {
        seenEmail.add(key);
        uniqueValid.push(item);
      }
    });

    if (uniqueValid.length === 0) {
      return {
        created: [],
        skipped: [],
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          skipped: 0,
          failed: errors.length,
        },
      };
    }

    // 3️⃣ load user theo email
    const emails = uniqueValid.map((i) => i.userEmail.toLowerCase());

    const users = await User.find({
      email: { $in: emails },
    })
      .select("_id fullname email")
      .lean();

    const userMap = new Map(users.map((u) => [u.email.toLowerCase(), u]));

    const userIds = users.map((u) => u._id);

    // 4️⃣ check instructor đã tồn tại theo user
    const existingInstructors = await Instructor.find({
      user: { $in: userIds },
    })
      .select("user")
      .lean();

    const existUserSet = new Set(
      existingInstructors.map((i) => i.user.toString())
    );

    const toCreate = [];

    // 5️⃣ map + build data create
    uniqueValid.forEach((item, index) => {
      const user = userMap.get(item.userEmail.toLowerCase());

      if (!user) {
        errors.push({
          index,
          code: INSTRUCTOR_CODES.INSTRUCTOR_USER_NOT_FOUND,
          email: item.userEmail,
          reason: ["Không tìm thấy user theo email"],
        });
        return;
      }

      if (existUserSet.has(user._id.toString())) {
        errors.push({
          index,
          code: INSTRUCTOR_CODES.INSTRUCTOR_ALREADY_EXISTS,
          email: item.userEmail,
          reason: ["Instructor đã tồn tại cho user này"],
        });
        return;
      }

      toCreate.push({
        user: user._id,

        bio: item.bio || "",
        expertise: item.expertise || [],

        socialLinks: {
          github: item.github || "",
          linkedin: item.linkedin || "",
          youtube: item.youtube || "",
          website: item.website || "",
        },

        slug: slugify(user.fullname, {
          lower: true,
          strict: true,
        }),

        createdBy: updatedBy,
        updatedBy,
      });
    });

    if (toCreate.length === 0) {
      return {
        created: [],
        skipped: [],
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          skipped: 0,
          failed: errors.length,
        },
      };
    }

    // 6️⃣ insert
    const createdDocs = await Instructor.insertMany(toCreate, {
      ordered: false,
    });
    const instructorRole = await Role.findOne({ name: "instructor" });

    if (instructorRole) {
      const userIds = createdDocs.map((doc) => doc.user);

      await User.updateMany(
        { _id: { $in: userIds } },
        {
          $addToSet: { role_ids: instructorRole._id },
        }
      );
    }

    // 7️⃣ audit log
    await Promise.all(
      createdDocs.map((doc) =>
        saveAuditLogs({
          entityType: "instructors",
          entityId: doc._id,
          oldData: {},
          newData: mapInstructor(doc),
          updatedBy,
        })
      )
    );

    return {
      created: createdDocs.map(mapInstructor),
      skipped: [],
      errors,
      summary: {
        total: inputList.length,
        created: createdDocs.length,
        skipped: 0,
        failed: errors.length,
      },
    };
  },

  async getInstructorById(id) {
    const instructor = await Instructor.findById(id)
      .populate("user", "fullname email")
      .populate("coursesTaught.course", "title category price")
      .lean();
    return instructor || null;
  },

  async getInstructorBySlug(slug) {
    const instructor = await Instructor.findOne({ slug })
      .populate("user", "fullname email")
      .populate("coursesTaught.course", "title category price")
      .lean();
    return instructor || null;
  },

  async listAdminInstructorsUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = buildInstructorFilter(query);

    const sort = buildInstructorSort(query.sort);

    const [docs, total] = await Promise.all([
      Instructor.find(filter)
        .populate("user", "fullname email phone avatar")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Instructor.countDocuments(filter),
    ]);

    const data = docs.map(mapInstructor);

    return {
      data,

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
  async listPublicInstructorsUseCase({ query }) {
    const limit = Number(query.limit) || 12;
    const cursor = query.cursor;

    const filter = buildInstructorFilter(query);

    if (cursor) {
      const cursorDoc = await Instructor.findById(cursor).select("createdAt");

      filter.$or = [
        {
          createdAt: { $lt: cursorDoc.createdAt },
        },
        {
          createdAt: cursorDoc.createdAt,
          _id: { $lt: cursor },
        },
      ];
    }

    const docs = await Instructor.find(filter)
      .populate("user", "fullname email phone avatar")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map(mapInstructor);

    return {
      data,

      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },
  async getInstructorFilterOptions() {
    try {
      const [expertise] = await Promise.all([Instructor.distinct("expertise")]);

      return {
        expertise: expertise.filter(Boolean).sort((a, b) => a.localeCompare(b)),
      };
    } catch (err) {
      console.error("getInstructorFilterOptions service error:", err);

      throw new AppError(
        INSTRUCTOR_CODES.INSTRUCTOR_FILTER_OPTIONS_FAILED,
        "Không thể lấy filter options",
        500
      );
    }
  },
  async getInstructorOptions() {
    try {
      const docs = await Instructor.find()
        .populate("user", "fullname email avatar")
        .select("_id user slug")
        .sort({ createdAt: -1 })
        .lean();

      return docs.map((doc) => ({
        id: doc._id.toString(),

        name: doc.user?.fullname || "Unknown",
        email: doc.user?.email || null,
        avatar: doc.user?.avatar || null,

        slug: doc.slug,
      }));
    } catch (err) {
      console.error("getInstructorOptions error:", err);

      throw new AppError(
        INSTRUCTOR_CODES.INSTRUCTOR_LIST_FAILED,
        "Không thể lấy instructor options",
        500
      );
    }
  },
  async getInstructorByUserId(userId) {
    const instructor = await Instructor.findOne({ user: userId })
      .populate("user", "fullname email")
      .lean();
    return instructor || null;
  },

  async updateInstructor(id, data, user) {
    try {
      if (!id) {
        throw new AppError(
          INSTRUCTOR_CODES.INSTRUCTOR_INVALID_ID,
          "Thiếu id instructor",
          400
        );
      }

      // 1️⃣ check tồn tại
      const oldDoc = await Instructor.findById(id);
      if (!oldDoc) {
        throw new AppError(
          INSTRUCTOR_CODES.INSTRUCTOR_NOT_FOUND,
          "Không tìm thấy instructor",
          404
        );
      }

      const oldMapped = mapInstructor(oldDoc);

      // 2️⃣ chuẩn hóa data
      const updateData = { ...data };

      if (updateData.expertise) {
        updateData.expertise = updateData.expertise.map((s) => s.trim());
      }

      // 3️⃣ không cho update user (khóa cứng)
      delete updateData.user;

      // 4️⃣ update
      const updatedDoc = await Instructor.findByIdAndUpdate(id, updateData, {
        new: true,
      })
        .populate("user", "fullname email phone")
        .lean();

      const mapped = mapInstructor(updatedDoc);

      // 5️⃣ audit log
      await saveAuditLogs({
        entityType: "instructors",
        entityId: id,
        action: "update",
        oldData: oldMapped,
        newData: mapped,
        updatedBy: getUserIdentifier(user),
      });

      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("updateInstructor service error:", err);

      throw new AppError(
        INSTRUCTOR_CODES.INSTRUCTOR_UPDATE_FAILED,
        "Không thể cập nhật instructor",
        500
      );
    }
  },
  async updateInstructorBySlug(slug, updateData) {
    const updated = await Instructor.findOneAndUpdate({ slug }, updateData, {
      new: true,
    })
      .populate("user", "fullname email")
      .lean();
    return updated || null;
  },

  async addCourseToInstructor({ instructorId, courseId, status = "active" }) {
    const instructor = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        $push: {
          coursesTaught: {
            course: courseId,
            status,
            assignedAt: new Date(),
          },
        },
      },
      { new: true }
    ).lean();
    return instructor;
  },

  async updateRating({ instructorId, newRating }) {
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) return null;

    const total =
      instructor.rating.average * instructor.rating.count + newRating;
    instructor.rating.count += 1;
    instructor.rating.average = total / instructor.rating.count;
    await instructor.save();

    return instructor.toJSON();
  },

  async deleteInstructor(id) {
    await Instructor.findByIdAndDelete(id);
    return true;
  },

  async removeManyInstructors(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        INSTRUCTOR_CODES.INSTRUCTOR_DELETE_EMPTY_IDS,
        "Không có giảng viên để xóa",
        400
      );
    }

    // ✅ lấy data cũ
    const instructors = await Instructor.find({ _id: { $in: ids } });

    if (instructors.length !== ids.length) {
      const foundIds = instructors.map((i) => i._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        INSTRUCTOR_CODES.INSTRUCTOR_NOT_FOUND,
        `Không tìm thấy giảng viên: ${notFoundIds.join(", ")}`,
        404
      );
    }

    const mappedOld = instructors.map(mapInstructor);

    // ✅ delete
    await Instructor.deleteMany({ _id: { $in: ids } });

    // ✅ audit log trong service
    await Promise.all(
      instructors.map((doc, index) =>
        saveAuditLogs({
          entityType: "instructors",
          entityId: doc._id,
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

  async getInstructorStats(instructorId) {
    const instructor = await Instructor.findById(instructorId)
      .populate({
        path: "coursesTaught.course",
        select: "title enrolledCount rating",
      })
      .lean();

    if (!instructor) return null;

    const totalCourses = instructor.coursesTaught.length;
    const totalStudents = instructor.totalStudents;
    const avgRating = instructor.rating.average;

    return {
      totalCourses,
      totalStudents,
      avgRating,
      courses: instructor.coursesTaught,
    };
  },
  async getInstructorsForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.expertise = { $regex: filters.search, $options: "i" };
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Instructor.find(query)
      .populate("user", "fullname email")
      .sort({ createdAt: -1 })
      .lean();
  },

  async previewExportInstructors({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateInstructorExportScope({ scope, selectedIds });

    const list = await this.getInstructorsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!list.length) {
      throw new AppError(
        INSTRUCTOR_CODES.INSTRUCTOR_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = list.map(mapInstructor);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },

  async exportInstructors({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateInstructorExportScope({ scope, selectedIds });
    validateInstructorExportFormat(format);

    const list = await this.getInstructorsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!list.length) {
      throw new AppError(
        INSTRUCTOR_CODES.INSTRUCTOR_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportInstructorsFile({
      instructors: list,
      format,
    });

    await saveAuditLogs({
      entityType: "instructors",
      action: "export",
      entityId: null,
      oldData: {},
      newData: { count: list.length, format },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `instructors_${Date.now()}.${
        format === "excel" ? "xlsx" : "pdf"
      }`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default InstructorService;
