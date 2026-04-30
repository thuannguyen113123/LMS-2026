import RoleServices from "../role/role.services.js";
import Instructor from "../../models/instructor/instructor.model.js";
import Student from "../../models/student/student.model.js";

import Role from "../../models/role/role.model.js";
import User from "../../models/user/user.model.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import crypto from "crypto";
import { formatPhoneNumber, generate6DigitCode } from "../../utils/helpers.js";
import AppError from "../../utils/AppError.js";
import authService from "../../services/auth/auth.services.js";
import userVerificationService from "../../services/userVerification/userVerification.service.js";

import { exportUsersFile } from "./user.export.service.js";
import mongoose from "mongoose";
import { sendOtpSms } from "../notification/smsService.js";
import { sendSetPasswordEmail } from "../notification/emailService.js";
import { USER_CODES } from "../../constants/user.code.js";
import { userBulkSchema } from "../../validators/user/user.validator.js";

export const mapUser = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    fullname: doc.fullname,
    email: doc.email,
    phone: doc.phone,
    avatar: doc.avatar,
    provider: doc.provider,

    roles:
      doc.role_ids?.map((r) => ({
        id: r._id?.toString?.() || r.toString(),
        name: r.name,
      })) || [],

    activeRole: doc.active_role_id
      ? {
          id:
            doc.active_role_id._id?.toString?.() ||
            doc.active_role_id.toString(),
          name: doc.active_role_id.name,
        }
      : null,
    preferences: doc.preferences || {
      theme: "light",
      language: "vi",
      notifications: true,
    },
    isActive: doc.isActive,
    verified: doc.verified,
    locked: doc.locked,
    isOnline: doc.isOnline,

    lastLogin: doc.lastLogin,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
function mapUserSearch(user) {
  return {
    id: user._id.toString(),
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar || null,
    role: user.role,
  };
}
export const mapProfile = ({ user, student, instructor }) => {
  if (!user) return null;

  if (user.toObject) user = user.toObject();

  const base = {
    id: user._id?.toString(),
    fullname: user.fullname,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,

    provider: user.provider,

    role: user.active_role_id?.name || null,

    isActive: user.isActive,
    verified: user.verified,
    locked: user.locked,
    isOnline: user.isOnline,

    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  const profiles = {};

  if (student) {
    if (student.toObject) student = student.toObject();

    profiles.student = {
      slug: student.slug,

      enrolledCourses: student.enrolledCourses?.map((item) => ({
        course: item.course,
        enrolledAt: item.enrolledAt,
        progress: item.progress,
        completed: item.completed,
        lastAccessed: item.lastAccessed,
      })),

      bookmarks: student.bookmarks?.map((item) => ({
        course: item.course,
        addedAt: item.addedAt,
      })),

      certificates: student.certificates?.map((item) => ({
        course: item.course,
        issuedAt: item.issuedAt,
        certificateUrl: item.certificateUrl,
      })),

      preferences: student.preferences,
    };
  }

  /* ================= INSTRUCTOR ================= */

  if (instructor) {
    if (instructor.toObject) instructor = instructor.toObject();

    profiles.instructor = {
      id: instructor._id?.toString(),

      slug: instructor.slug,

      bio: instructor.bio,
      expertise: instructor.expertise,
      socialLinks: instructor.socialLinks,

      coursesTaught: instructor.coursesTaught?.map((item) => ({
        course: item.course,
        assignedAt: item.assignedAt,
        status: item.status,
      })),

      totalStudents: instructor.totalStudents,

      rating: {
        ...instructor.rating,
        viewerRating: instructor.viewerRating ?? null,
      },
    };
  }

  return {
    ...base,
    profiles,
    hasStudentProfile: !!student,
    hasInstructorProfile: !!instructor,
  };
};
export const USER_IMPORT_FORBIDDEN_FIELDS = [
  "_id",
  "password",
  "provider",
  "role_ids",
  "verified",
  "locked",
  "createdAt",
  "updatedAt",
  "lastLogin",
  "isOnline",
];
function buildUserSearchFilter({ query, excludeIds }) {
  const filter = {
    isActive: true,
  };

  if (excludeIds?.length) {
    filter._id = {
      $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  if (query?.trim()) {
    const keyword = query.trim();
    const regex = new RegExp(keyword.replace(/\s+/g, ".*"), "i");

    filter.$or = [{ fullname: regex }, { email: regex }, { phone: regex }];
  }

  return filter;
}
export const validateUserExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      USER_CODES.USER_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      USER_CODES.USER_EXPORT_SELECTED_EMPTY,
      "Chưa chọn user để export",
      400
    );
  }
};

export const validateUserExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      USER_CODES.USER_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
export function buildUserFilter({ query }) {
  const filter = {
    isActive: true,
  };

  // role filter
  if (query.role && query.role !== "all") {
    filter.active_role_id = query.role;
  }

  // search
  if (query.search?.trim()) {
    const keyword = query.search.trim();

    filter.$or = [
      { fullname: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
    ];
  }

  return filter;
}
const getUserIdentifier = (user) => user?.email || user?.id || "unknown";
const UserSevice = {
  async adminCreateUser(payload, currentUser) {
    try {
      const { fullname, email, phone, role_ids } = payload;

      if (!fullname) {
        throw new AppError(
          USER_CODES.USER_INVALID,
          "Fullname là bắt buộc",
          400
        );
      }

      if (!email && !phone) {
        throw new AppError(
          USER_CODES.CONTACT_INVALID,
          "Phải có email hoặc phone",
          400
        );
      }

      const normalizedEmail = email?.toLowerCase().trim() || null;

      let normalizedPhone = null;
      if (phone) {
        try {
          normalizedPhone = formatPhoneNumber(phone);
        } catch {
          throw new AppError(
            USER_CODES.CONTACT_INVALID,
            "Số điện thoại không hợp lệ",
            400
          );
        }
      }

      const existedUser = normalizedEmail
        ? await authService.getUserByEmail(normalizedEmail)
        : await authService.getUserByPhone(normalizedPhone);

      if (existedUser) {
        throw new AppError(
          USER_CODES.USER_EXISTS,
          "Người dùng đã tồn tại",
          409
        );
      }

      let roleId;

      if (role_ids) {
        const roleDoc = await RoleServices.getRoleById(role_ids);

        if (!roleDoc) {
          throw new AppError(
            USER_CODES.USER_ROLE_REQUIRED,
            "Role không tồn tại",
            400
          );
        }

        roleId = roleDoc._id;
      } else {
        roleId = await RoleServices.getDefaultRoleId("student");
      }

      const created = await authService.createUser({
        fullname,
        email: normalizedEmail,
        phone: normalizedPhone,
        password: null,
        role_ids: [roleId],
        active_role_id: roleId,
        provider: "local",
        isActive: false,
        verified: false,
        locked: false,
        createdBy: currentUser?._id,
        updatedBy: currentUser?._id,
      });

      await userVerificationService.deleteSetPasswordToken(created._id);

      let nextStep = null;

      if (normalizedEmail) {
        const token = crypto.randomBytes(32).toString("hex");

        await userVerificationService.saveVerificationToken({
          userId: created._id,
          type: "set-password",
          token,
          expiry: Date.now() + 24 * 60 * 60 * 1000,
        });

        await sendSetPasswordEmail(normalizedEmail, token);
        nextStep = "set-password-email";
      }

      if (normalizedPhone) {
        const otp = generate6DigitCode();

        await userVerificationService.saveVerificationToken({
          userId: created._id,
          type: "set-password-otp",
          token: otp,
          expiry: Date.now() + 5 * 60 * 1000,
        });

        await sendOtpSms(normalizedPhone, otp);
        nextStep = "set-password-otp";
      }

      await saveAuditLogs({
        entityType: "users",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: mapUser(created),
        updatedBy: getUserIdentifier(currentUser),
      });

      return {
        user: mapUser(created),
        nextStep,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("adminCreateUser service error:", err);

      throw new AppError(
        USER_CODES.USER_CREATE_FAILED,
        "Tạo user thất bại",
        500
      );
    }
  },

  async bulkCreateUsers(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      return {
        created: [],
        skipped: [],
        errors: [
          {
            code: USER_CODES.USER_BULK_INVALID_PAYLOAD,
            reason: "Danh sách user không hợp lệ",
          },
        ],
        summary: {
          total: 0,
          created: 0,
          skipped: 0,
          failed: 1,
        },
      };
    }

    const validItems = [];
    const errors = [];

    inputList.forEach((item, index) => {
      // chặn field cấm
      USER_IMPORT_FORBIDDEN_FIELDS.forEach((field) => {
        if (field in item) {
          errors.push({
            index,
            code: USER_CODES.USER_IMPORT_FORBIDDEN_FIELD,
            reason: `Không được import field "${field}"`,
          });
        }
      });

      const { error, value } = userBulkSchema.validate(item, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        errors.push({
          index,
          code: USER_CODES.USER_BULK_VALIDATION_FAILED,
          name: item?.fullname || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push({
          ...value,
          role: value.role.toLowerCase().trim(),
        });
      }
    });

    if (validItems.length === 0) {
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

    const roleNames = [...new Set(validItems.map((i) => i.role))];

    const roles = await Role.find({
      name: { $in: roleNames },
    })
      .select("_id name")
      .lean();

    const roleMap = new Map(roles.map((r) => [r.name.toLowerCase(), r._id]));

    const mappedItems = [];

    validItems.forEach((item, index) => {
      const roleId = roleMap.get(item.role);

      if (!roleId) {
        errors.push({
          index,
          code: USER_CODES.USER_ROLE_NOT_FOUND,
          name: item.fullname,
          reason: `Role "${item.role}" không tồn tại`,
        });
        return;
      }

      mappedItems.push({
        fullname: item.fullname,
        email: item.email || undefined,
        phone: item.phone || undefined,
        role_ids: [roleId],
        active_role_id: roleId,
        provider: "local", // required
        password: null,
        isActive: item.isActive ?? false,
        verified: false,
        locked: false,
      });
    });

    if (mappedItems.length === 0) {
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

    const emails = mappedItems.filter((i) => i.email).map((i) => i.email);
    const phones = mappedItems.filter((i) => i.phone).map((i) => i.phone);

    const existed = await User.find({
      $or: [
        emails.length ? { email: { $in: emails } } : null,
        phones.length ? { phone: { $in: phones } } : null,
      ].filter(Boolean),
    }).lean();

    const existedEmail = new Set(existed.map((u) => u.email).filter(Boolean));
    const existedPhone = new Set(existed.map((u) => u.phone).filter(Boolean));

    const toCreate = [];
    const skipped = [];

    mappedItems.forEach((item) => {
      if (
        (item.email && existedEmail.has(item.email)) ||
        (item.phone && existedPhone.has(item.phone))
      ) {
        skipped.push({
          code: USER_CODES.USER_ALREADY_EXISTS,
          name: item.email || item.phone,
        });
      } else {
        toCreate.push(item);
      }
    });

    let createdDocs = [];

    if (toCreate.length > 0) {
      try {
        createdDocs = await User.insertMany(toCreate, {
          ordered: false,
        });
      } catch (err) {
        console.error("USER BULK INSERT ERROR:", err);

        if (err.writeErrors?.length) {
          err.writeErrors.forEach((e) => {
            errors.push({
              code: USER_CODES.USER_ALREADY_EXISTS,
              reason: e.errmsg,
            });
          });

          createdDocs = err.insertedDocs || [];
        } else {
          errors.push({
            code: USER_CODES.USER_BULK_INSERT_FAILED,
            reason: err.message,
          });
        }
      }
    }

    return {
      created: createdDocs.map(mapUser),
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
  async getMyProfileUseCase(userId) {
    if (!userId) {
      throw new AppError(401, USER_CODES.USER_INVALID, "Chưa đăng nhập");
    }

    const user = await User.findById(userId)
      .populate("active_role_id", "name")
      .lean();

    if (!user) {
      throw new AppError(404, USER_CODES.USER_NOT_FOUND, "Không tìm thấy user");
    }

    // load role profiles song song
    const [student, instructor] = await Promise.all([
      Student.findOne({ user: userId }).lean(),
      Instructor.findOne({ user: userId }).lean(),
    ]);

    const profile = mapProfile({
      user,
      student,
      instructor,
    });

    return profile;
  },
  async getProfileBySlugUseCase(slug, type, viewerId) {
    if (!slug) {
      throw new AppError(USER_CODES.USER_INVALID, "Slug không hợp lệ", 400);
    }

    const [student, instructor] = await Promise.all([
      Student.findOne({ slug })
        .populate({
          path: "user",
          populate: {
            path: "role_ids",
            select: "name",
          },
        })
        .lean(),

      Instructor.findOne({ slug })
        .populate({
          path: "user",
          populate: {
            path: "role_ids",
            select: "name",
          },
        })
        .lean(),
    ]);

    if (instructor) {
      let viewerRating = null;

      if (viewerId) {
        const viewerStudent = await Student.findOne({ user: viewerId })
          .select("instructorRatings")
          .lean();

        if (viewerStudent?.instructorRatings?.length) {
          const found = viewerStudent.instructorRatings.find(
            (r) => String(r.instructor) === String(instructor._id)
          );

          viewerRating = found?.rating ?? null;
        }
      }

      return mapProfile({
        user: instructor.user,
        instructor: {
          ...instructor,
          viewerRating,
        },
      });
    }

    if (student) {
      return mapProfile({
        user: student.user,
        student,
      });
    }

    throw new AppError(
      USER_CODES.USER_NOT_FOUND,
      "Không tìm thấy profile",
      404
    );
  },
  // async getProfileBySlugUseCase(slug, type, viewerId) {
  //   if (!slug) {
  //     throw new AppError(USER_CODES.USER_INVALID, "Slug không hợp lệ", 400);
  //   }

  //   if (type === "instructor") {
  //     const instructor = await Instructor.findOne({ slug })
  //       .populate({
  //         path: "user",
  //         populate: {
  //           path: "role_ids",
  //           select: "name",
  //         },
  //       })
  //       .lean();

  //     let viewerRating = null;

  //     if (viewerId) {
  //       const student = await Student.findOne({ user: viewerId })
  //         .select("instructorRatings")
  //         .lean();
  //       console.log("instructor._id", instructor._id.toString());

  //       student.instructorRatings.forEach((r) => {
  //         console.log("rating instructor", r.instructor.toString());
  //       });
  //       if (student) {
  //         const found = student.instructorRatings.find(
  //           (r) => r.instructor.toString() === instructor._id.toString()
  //         );

  //         viewerRating = found?.rating ?? null;
  //       }
  //     }

  //     if (!instructor) {
  //       throw new AppError(
  //         USER_CODES.USER_NOT_FOUND,
  //         "Không tìm thấy instructor profile",
  //         404
  //       );
  //     }

  //     return mapProfile({
  //       user: instructor.user,
  //       instructor: {
  //         ...instructor,
  //         viewerRating,
  //       },
  //     });
  //   }

  //   if (type === "student") {
  //     const student = await Student.findOne({ slug })
  //       .populate({
  //         path: "user",
  //         populate: {
  //           path: "role_ids",
  //           select: "name",
  //         },
  //       })
  //       .lean();

  //     if (!student) {
  //       throw new AppError(
  //         USER_CODES.USER_NOT_FOUND,
  //         "Không tìm thấy student profile",
  //         404
  //       );
  //     }

  //     return mapProfile({
  //       user: student.user,
  //       student,
  //     });
  //   }

  //   const [student, instructor] = await Promise.all([
  //     Student.findOne({ slug })
  //       .populate({
  //         path: "user",
  //         populate: {
  //           path: "role_ids",
  //           select: "name",
  //         },
  //       })
  //       .lean(),

  //     Instructor.findOne({ slug })
  //       .populate({
  //         path: "user",
  //         populate: {
  //           path: "role_ids",
  //           select: "name",
  //         },
  //       })
  //       .lean(),
  //   ]);

  //   if (instructor) {
  //     return mapProfile({
  //       user: instructor.user,
  //       instructor,
  //     });
  //   }

  //   if (student) {
  //     return mapProfile({
  //       user: student.user,
  //       student,
  //     });
  //   }

  //   throw new AppError(
  //     USER_CODES.USER_NOT_FOUND,
  //     "Không tìm thấy profile",
  //     404
  //   );
  // },
  async getUserById(id) {
    const user = await User.findById(id).lean();
    return user;
  },
  async listAdminUsersUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = buildUserFilter({ query });

    const sort = { createdAt: -1, _id: -1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: "role_ids",
          select: "_id name",
        })
        .lean(),

      User.countDocuments(filter),
    ]);

    return {
      data: users.map(mapUser),

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
  async updateUserPreferences(userId, payload) {
    if (!userId) {
      throw new AppError(USER_CODES.USER_INVALID, "User không hợp lệ", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(USER_CODES.USER_NOT_FOUND, "Không tìm thấy user", 404);
    }

    const updateData = {};

    if (payload.theme) {
      if (!["light", "dark", "system"].includes(payload.theme)) {
        throw new AppError(USER_CODES.USER_INVALID, "Theme không hợp lệ", 400);
      }

      updateData["preferences.theme"] = payload.theme;
    }

    if (payload.language) {
      updateData["preferences.language"] = payload.language;
    }

    if (payload.notifications !== undefined) {
      updateData["preferences.notifications"] = payload.notifications;
    }

    if (!Object.keys(updateData).length) {
      throw new AppError(
        USER_CODES.USER_INVALID,
        "Không có dữ liệu để cập nhật",
        400
      );
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    return updated.preferences;
  },

  //Hàm update
  async updateAdminFormUser(userId, payload) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(USER_CODES.USER_NOT_FOUND);

    if (payload.fullname) {
      user.fullname = payload.fullname.trim();
    }

    await user.save();
    return user;
  },
  async updateAdminInline(userId, payload) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(USER_CODES.USER_NOT_FOUND);

    if (payload.role_ids) {
      await RoleServices.handleRoleChange(user, payload.role_ids);
    }

    if (payload.isActive !== undefined) {
      user.isActive = payload.isActive;
    }

    if (payload.locked !== undefined) {
      user.locked = payload.locked;
    }

    await user.save();
    return user;
  },
  async updateSelfProfile(userId, payload) {
    const user = await User.findById(userId)
      .populate("role_ids")
      .populate("active_role_id");

    if (!user) {
      throw new AppError("USER_NOT_FOUND", "User không tồn tại", 404);
    }

    if (payload.fullname && payload.fullname !== user.fullname) {
      user.fullname = payload.fullname;
    }

    if (payload.email && payload.email !== user.email) {
      const exists = await User.exists({ email: payload.email });

      if (exists) {
        throw new AppError("EMAIL_ALREADY_EXISTS", "Email đã tồn tại", 400);
      }

      user.email = payload.email;
      user.verified = false;
    }

    if (payload.phone && payload.phone !== user.phone) {
      const exists = await User.exists({ phone: payload.phone });

      if (exists) {
        throw new AppError(
          "PHONE_ALREADY_EXISTS",
          "Số điện thoại đã tồn tại",
          400
        );
      }

      user.phone = payload.phone;
      user.phoneVerified = false;
    }

    if (payload.avatar) {
      user.avatar = payload.avatar;
    }

    await user.save();

    // ================= INSTRUCTOR FIELDS =================

    const roleName = user.active_role_id?.name;

    if (roleName === "instructor") {
      const updateData = {};

      if (payload.bio !== undefined) {
        updateData.bio = payload.bio;
      }

      if (payload.expertise !== undefined) {
        updateData.expertise = payload.expertise;
      }

      if (payload.socialLinks !== undefined) {
        updateData.socialLinks = payload.socialLinks;
      }

      if (Object.keys(updateData).length > 0) {
        await Instructor.updateOne(
          { user: userId },
          { $set: updateData },
          { upsert: true }
        );
      }
    }

    return mapProfile({ user });
  },

  async removeManyUsers(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        USER_CODES.USER_DELETE_MANY_INVALID_PAYLOAD,
        "Không có user để xóa",
        400
      );
    }

    const users = await User.find({ _id: { $in: ids } });

    if (users.length !== ids.length) {
      throw new AppError(
        USER_CODES.USER_DELETE_MANY_NOT_FOUND,
        "Có user không tồn tại",
        404
      );
    }

    // audit trước khi xóa
    await Promise.all(
      users.map((user) =>
        saveAuditLogs({
          entityType: "users",
          entityId: user._id.toString(),
          oldData: mapUser(user.toObject()),
          newData: {},
          updatedBy: actor,
          action: "delete",
          timestamp: Date.now(),
        })
      )
    );

    await User.deleteMany({ _id: { $in: ids } });

    return {
      deletedIds: ids,
      deletedCount: ids.length,
    };
  },

  /* ---------- EXPORT ---------- */
  async getUsersForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.$or = [
        { fullname: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } },
      ];
    }

    if (typeof filters?.isActive === "boolean") {
      query.isActive = filters.isActive;
    }

    if (filters?.provider) {
      query.provider = filters.provider;
    }

    if (filters?.roleId) {
      query.active_role_id = filters.roleId;
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    const users = await User.find(query)
      .populate("role_ids", "name description")
      .sort({ createdAt: -1 })
      .lean();

    return users.map(mapUser);
  },

  async previewExportUsers({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateUserExportScope({ scope, selectedIds });

    const users = await this.getUsersForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!users.length) {
      throw new AppError(
        USER_CODES.USER_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    return {
      total: users.length,
      columns: [
        "fullname",
        "email",
        "phone",
        "role",
        "provider",
        "isActive",
        "verified",
        "lastLogin",
        "createdAt",
      ],
      preview: users.slice(0, 10).map((u) => ({
        id: u.id,
        fullname: u.fullname,
        email: u.email,
        phone: u.phone,

        role: {
          name: u.role?.name,
        },

        provider: u.provider,
        isActive: u.isActive,
        verified: u.verified,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
      })),
    };
  },

  async exportUsers({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateUserExportScope({ scope, selectedIds });
    validateUserExportFormat(format);

    const users = await this.getUsersForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!users.length) {
      throw new AppError(
        USER_CODES.USER_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportUsersFile({
      users,
      format,
    });

    return {
      buffer,
      fileName: `users_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },

  async searchUsersUseCase({ query }) {
    const search = query.query?.trim().toLowerCase() || "";
    const limit = Number(query.limit) || 10;

    const excludeIdsRaw = Array.isArray(query.excludeIds)
      ? query.excludeIds
      : query.excludeIds
      ? [query.excludeIds]
      : [];

    const filter = buildUserSearchFilter({
      query: search,
      excludeIds: excludeIdsRaw,
    });

    const docs = await User.find(filter)
      .select("_id fullname email avatar role")
      .sort({ fullname: 1, _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;

    const data = docs.slice(0, limit).map(mapUserSearch);

    return {
      data,
      pagination: {
        limit,
        hasNext,
        nextPageToken: hasNext ? data.at(-1).id : null,
      },
    };
  },
};

export default UserSevice;
