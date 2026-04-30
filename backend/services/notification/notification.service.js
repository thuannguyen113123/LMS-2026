import Notification from "../../models/notification/notification.model.js";
import User from "../../models/user/user.model.js";
import Student from "../../models/student/student.model.js";

import { getIO } from "../../sockets/socket.js";

export const TYPE_SETTING_MAP = {
  COURSE_NEW: "course_new",
  COURSE_PURCHASED: "course_purchased",
  STUDENT_ENROLLED: "student_enrolled",
  COURSE_COMMENT: "course_comment",
  USER_REPORT: "user_report",
  USER_REGISTERED: "user_registered",
  INSTRUCTOR_UPGRADE_REQUEST: "instructor_upgrade_request",
  INSTRUCTOR_APPROVED: "instructor_approved",
  INSTRUCTOR_REJECTED: "instructor_rejected",
  CONTACT_MESSAGE: "contact_message",
};
const ROLE_VISIBLE_SETTINGS = {
  student: [TYPE_SETTING_MAP.COURSE_NEW, TYPE_SETTING_MAP.COURSE_PURCHASED],

  instructor: [
    TYPE_SETTING_MAP.COURSE_NEW,
    TYPE_SETTING_MAP.COURSE_PURCHASED,
    TYPE_SETTING_MAP.STUDENT_ENROLLED,
    TYPE_SETTING_MAP.COURSE_COMMENT,
  ],

  admin: [
    TYPE_SETTING_MAP.USER_REPORT,
    TYPE_SETTING_MAP.USER_REGISTERED,
    TYPE_SETTING_MAP.INSTRUCTOR_UPGRADE_REQUEST,
    TYPE_SETTING_MAP.INSTRUCTOR_APPROVED,
    TYPE_SETTING_MAP.INSTRUCTOR_REJECTED,
    TYPE_SETTING_MAP.CONTACT_MESSAGE,
  ],
};
function buildSettingsByRole(role, userSettings = {}) {
  const visibleKeys = ROLE_VISIBLE_SETTINGS[role] || [];

  const result = {};

  for (const key of visibleKeys) {
    result[key] = userSettings?.[key] ?? true;
  }

  return result;
}
export function buildNotificationFilter({ userId, query }) {
  const filter = { userId };

  // unread
  if (query.filter === "unread") {
    filter.read = false;
  }

  // type
  if (query.type) {
    const types = Array.isArray(query.type) ? query.type : [query.type];

    filter.type = { $in: types };
  }

  // search (optional)
  if (query.search?.trim()) {
    filter.title = {
      $regex: query.search.trim(),
      $options: "i",
    };
  }

  return filter;
}
export function buildNotificationSort(query) {
  switch (query.sort) {
    case "oldest":
      return { createdAt: 1, _id: 1 };

    default:
      return { createdAt: -1, _id: -1 };
  }
}
async function canSendNotification(userId, type) {
  const settingKey = TYPE_SETTING_MAP[type];

  if (!settingKey) return true;

  const user = await User.findById(userId)
    .select("preferences.notificationSettings")
    .lean();

  if (!user) return false;

  return user.preferences.notificationSettings?.[settingKey] !== false;
}
const allowedFields = Object.values(TYPE_SETTING_MAP);

export const mapNotification = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    type: doc.type,
    title: doc.title,
    message: doc.message,

    read: doc.read,

    entityId: doc.entityId?.toString() || null,
    entityType: doc.entityType || null,

    meta: doc.meta || {},

    createdAt: doc.createdAt,
  };
};
const NotificationService = {
  async send(payload) {
    const allowed = await canSendNotification(payload.userId, payload.type);

    if (!allowed) {
      console.log("🔕 notification blocked by user settings");
      return null;
    }

    // 1. create
    const notification = await Notification.create(payload);

    // 2. map DTO
    const mapped = mapNotification(notification);

    // 3. emit realtime (KHÔNG dùng isReady)
    const io = getIO();
    const room = `user:${payload.userId}`;

    io.to(room).emit("notification:new", mapped);

    return mapped;
  },
  async broadcastToStudents(payload) {
    const io = getIO();

    const students = await Student.find({}).select("user").lean();

    const notifications = students.map((s) => ({
      userId: s.user,
      ...payload,
    }));

    const created = await Notification.insertMany(notifications);

    // ✅ REALTIME EMIT
    created.forEach((n) => {
      const mapped = mapNotification(n);
      const room = `user:${n.userId.toString()}`;

      io.to(room).emit("notification:new", mapped);
    });

    return created;
  },

  async getNotificationSettings(userId, roleFromToken) {
    const user = await User.findById(userId)
      .select("preferences.notificationSettings")
      .lean();

    if (!user) throw new Error("User not found");

    const role = roleFromToken || "student";

    return buildSettingsByRole(
      role,
      user?.preferences?.notificationSettings || {}
    );
  },
  async updateNotificationSettings(userId, payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid payload");
    }

    const updates = {};

    // whitelist fields
    for (const key in payload) {
      if (!allowedFields.includes(key)) continue;

      updates[`preferences.notificationSettings.${key}`] = Boolean(
        payload[key]
      );
    }

    // không có field hợp lệ
    if (Object.keys(updates).length === 0) {
      const user = await User.findById(userId)
        .select("preferences.notificationSettings")
        .lean();

      return user?.preferences?.notificationSettings || {};
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    )
      .populate("active_role_id", "name")
      .select("preferences.notificationSettings active_role_id")
      .lean();

    if (!user) throw new Error("User not found");

    const role = user?.active_role_id?.name?.toLowerCase() || "student";

    return {
      ...buildSettingsByRole(
        role,
        user?.preferences?.notificationSettings || {}
      ),
    };
  },

  async getMyNotifications(userId, query) {
    if (!userId) {
      throw new AppError("UNAUTHORIZED", "Không tìm thấy user", 401);
    }

    const limit = Number(query.limit) || 10;
    const cursor = query.cursor;

    let filter = buildNotificationFilter({
      userId,
      query,
    });

    const sort = buildNotificationSort(query);

    // cursor pagination
    if (cursor) {
      const cursorDoc = await Notification.findById(cursor).select("createdAt");

      filter.$or = [
        { createdAt: { $lt: cursorDoc.createdAt } },
        {
          createdAt: cursorDoc.createdAt,
          _id: { $lt: cursor },
        },
      ];
    }

    const docs = await Notification.find(filter)
      .sort(sort)
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    if (hasNext) docs.pop();

    return {
      data: docs.map(mapNotification),
      pagination: {
        nextCursor: hasNext ? docs[docs.length - 1]._id : null,
        hasNext,
      },
    };
  },
  async markAsRead(userId, notificationIds = []) {
    if (!userId) throw new AppError("UNAUTHORIZED", "User chưa đăng nhập", 401);

    // Update nhiều notification
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, userId, read: false },
      { $set: { read: true } }
    );

    // Emit realtime update
    const io = getIO();
    notificationIds.forEach((id) => {
      io.to(`user:${userId}`).emit("notification:read", { id });
    });

    return result; // result.nModified → số notification đã mark read
  },
  async removeMany(userId, ids = []) {
    if (!userId) {
      throw new AppError("UNAUTHORIZED", "Chưa đăng nhập", 401);
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        "NOTIFICATION_DELETE_EMPTY",
        "Không có notification để xóa",
        400
      );
    }

    const notifications = await Notification.find({
      _id: { $in: ids },
      userId,
    });

    if (notifications.length !== ids.length) {
      throw new AppError(
        "NOTIFICATION_NOT_FOUND",
        "Một số notification không tồn tại",
        404
      );
    }

    await Notification.deleteMany({
      _id: { $in: ids },
      userId,
    });

    return {
      deletedIds: ids,
      deletedCount: ids.length,
    };
  },
};

export default NotificationService;
