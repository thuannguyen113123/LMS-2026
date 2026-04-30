import { CHAT_ROOM_CODES } from "../../constants/chatRoom.codes.js";
import ChatRoom from "../../models/chat/chatRoom.model.js";
import UserBlockService from "../../services/userBlock/userBlockService.js";
import User from "../../models/user/user.model.js";

import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";

import Message from "../../models/chat/message.model.js";

import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import {
  exportChatRoomsFile,
  mapChatRoomExportData,
} from "./chatRoom.export.js";

export const mapChatRoom = (doc, currentUserId = null) => {
  if (!doc) return null;

  const lastMessage = doc.metadata?.lastMessageId || null;
  let avatar = null;

  if (doc.type === "private") {
    avatar = resolvePrivateAvatar(doc, currentUserId);
  } else {
    avatar = resolveRoomAvatar(doc);
  }

  return {
    id: doc._id?.toString(),

    type: doc.type,
    name: doc.name || null,

    course_id: doc.course_id ? doc.course_id.toString() : null,

    user_ids: Array.isArray(doc.user_ids)
      ? doc.user_ids.map((id) => (id?._id ? id._id.toString() : id.toString()))
      : [],

    admins: Array.isArray(doc.admins)
      ? doc.admins.map((id) => (id?._id ? id._id.toString() : id.toString()))
      : [],

    created_at: doc.created_at,
    updated_at: doc.updated_at,

    lastMessage: doc.metadata?.lastMessageId,

    metadata: {
      avatar,
      lastMessage: lastMessage
        ? {
            id: lastMessage._id.toString(),
            content: lastMessage.content || "",
            senderId: lastMessage.senderId?.toString() || null,
            createdAt: lastMessage.createdAt,
            messageType: lastMessage.messageType,
          }
        : null,

      priorityLevel: doc.metadata?.priorityLevel ?? 0,
      bannedUsers: Array.isArray(doc.bannedUsers)
        ? doc.bannedUsers.map((id) =>
            id?._id ? id._id.toString() : id.toString()
          )
        : [],

      createdBy: doc.metadata?.createdBy
        ? doc.metadata.createdBy._id
          ? doc.metadata.createdBy._id.toString()
          : doc.metadata.createdBy.toString()
        : null,

      updatedBy: doc.metadata?.updatedBy
        ? doc.metadata.updatedBy._id
          ? doc.metadata.updatedBy._id.toString()
          : doc.metadata.updatedBy.toString()
        : null,
    },
  };
};

function mapRoomMember(user, adminIds = []) {
  return {
    id: user._id.toString(),
    fullname: user.fullname,
    email: user.email,
    isAdmin: adminIds.some(
      (adminId) => adminId.toString() === user._id.toString()
    ),
  };
}
export async function buildChatRoomFilter({ role, userId, query }) {
  const filter = {};

  const type = query.type || null;
  const search = query.search?.trim();

  // ===== ROLE =====

  if (role === "admin") {
    // admin thấy tất cả
  } else if (role === "instructor") {
    filter.user_ids = new mongoose.Types.ObjectId(userId);
  } else if (role === "student") {
    filter.user_ids = new mongoose.Types.ObjectId(userId);
  }

  // ===== TYPE =====

  if (type && type !== "all") {
    filter.type = type;
  }

  // ===== SEARCH =====

  if (search) {
    filter.name = {
      $regex: search,
      $options: "i",
    };
  }

  return filter;
}
export function buildChatRoomSort(sort) {
  switch (sort) {
    case "latest":
      return { created_at: -1, _id: -1 };

    case "oldest":
      return { created_at: 1, _id: 1 };

    case "active":
      return { updated_at: -1, _id: -1 };

    default:
      return { updated_at: -1, _id: -1 };
  }
}
export const validateChatRoomExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      CHAT_ROOM_CODES.CHATROOM_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      CHAT_ROOM_CODES.CHATROOM_EXPORT_SELECTED_EMPTY,
      "Chưa chọn chat room để export",
      400
    );
  }
};

export const validateChatRoomExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      CHAT_ROOM_CODES.CHATROOM_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
function generateColor(seed) {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return `hsl(${Math.abs(hash % 360)}, 60%, 55%)`;
}
export function buildGeneratedAvatar(room) {
  const seed = room._id.toString();

  return {
    url: null,
    type: "generated",
    color: generateColor(seed),
    updatedAt: new Date(),
  };
}
function resolveRoomAvatar(doc) {
  // group có avatar custom
  if (doc.metadata?.avatar?.type === "custom") {
    return doc.metadata.avatar;
  }

  // fallback generated
  return {
    url: null,
    type: "generated",
    color: doc.metadata?.avatar?.color || generateColor(doc._id.toString()),
  };
}

function resolvePrivateAvatar(doc, currentUserId) {
  if (!Array.isArray(doc.user_ids)) return null;

  const otherUser = doc.user_ids.find((u) => {
    const id = u._id?.toString() || u.toString();
    return id !== currentUserId?.toString();
  });

  if (!otherUser) return null;

  return {
    url: otherUser.avatar || null,
    type: "user",
    color: generateColor(otherUser._id.toString()),
  };
}
const ChatRoomModel = {
  async assertUserInRoom(roomId, userId) {
    const room = await ChatRoom.findById(roomId).select("user_ids");

    if (!room) {
      throw new AppError("ROOM_NOT_FOUND", "Room không tồn tại", 404);
    }

    const normalizedUserId = userId.toString().trim();

    const isMember = room.user_ids.some(
      (id) => id.toString() === normalizedUserId
    );

    if (!isMember) {
      throw new AppError(
        "ROOM_ACCESS_DENIED",
        "Bạn không thuộc phòng này",
        403
      );
    }

    return true;
  },
  async listAdminRoomsUseCase({ query, role, userId }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = await buildChatRoomFilter({
      role,
      userId,
      query,
    });

    const sort = buildChatRoomSort(query.sort);

    const [rooms, total] = await Promise.all([
      ChatRoom.find(filter)
        .populate("user_ids", "avatar fullname")
        .populate({
          path: "metadata.lastMessageId",
          select: "content senderId createdAt messageType",
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      ChatRoom.countDocuments(filter),
    ]);

    return {
      data: rooms.map((room) => mapChatRoom(room, userId)),

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
  async listUserRoomsUseCase({ query, role, userId }) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor;

    let filter = await buildChatRoomFilter({
      role,
      userId,
      query,
    });

    if (cursor) {
      const cursorDoc = await ChatRoom.findById(cursor).select("updated_at");

      if (cursorDoc) {
        filter.$or = [
          {
            updated_at: { $lt: cursorDoc.updated_at },
          },
          {
            updated_at: cursorDoc.updated_at,
            _id: { $lt: cursor },
          },
        ];
      }
    }

    const docs = await ChatRoom.find(filter)
      .populate("user_ids", "avatar fullname")
      .populate({
        path: "metadata.lastMessageId",
        select: "content senderId createdAt messageType attachments",
      })
      .sort({ updated_at: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map((room) => mapChatRoom(room, userId));

    return {
      data,

      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },

  async listRoomMembersUseCase({ roomId, userId }) {
    const room = await ChatRoom.findById(roomId)
      .populate("user_ids", "fullname email active_role_id")
      .lean();

    if (!room) {
      throw new AppError(
        "Phòng không tồn tại",
        404,
        CHAT_ROOM_CODES.ROOM_MEMBERS_LIST_FAILED
      );
    }

    const isMember = room.user_ids.some(
      (u) => u._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AppError(
        "Bạn không thuộc phòng này",
        403,
        CHAT_ROOM_CODES.ROOM_MEMBERS_LIST_FAILED
      );
    }

    const data = room.user_ids.map((user) => mapRoomMember(user, room.admins));

    return { data };
  },

  async createRoom(data, user) {
    try {
      const name = data.name?.trim();
      const type = data.type;

      if (!name) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_NAME_REQUIRED,
          "Tên phòng không hợp lệ",
          400
        );
      }

      const allowedTypes = ["course", "class", "teacher_student", "system"];

      if (!allowedTypes.includes(type)) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_INVALID_TYPE,
          "Loại phòng không hợp lệ",
          400
        );
      }

      // Optional: tránh trùng tên trong cùng type
      const existed = await ChatRoom.findOne({ name, type });

      if (existed) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_EXISTS,
          "Phòng đã tồn tại",
          409
        );
      }

      const created = await ChatRoom.create({
        name,
        type,
        user_ids: [user.id],
        admins: [user.id],
        metadata: {
          avatar: buildGeneratedAvatar({ _id: new mongoose.Types.ObjectId() }),
          createdBy: user.id,
          updatedBy: user.id,
        },
      });

      return mapChatRoom(created, user.id);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateRoom service error:", err);

      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_CREATE_FAILED,
        "Tạo phòng thất bại",
        500
      );
    }
  },

  async createPrivateRoom(userA, userB) {
    try {
      if (userA.toString() === userB.toString()) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_SELF_NOT_ALLOWED,
          "Không thể tạo phòng với chính mình",
          400
        );
      }

      const isBlocked = await UserBlockService.isBlockedBetween(userA, userB);

      if (isBlocked) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_BLOCKED,
          "Không thể tạo phòng chat",
          403
        );
      }

      // tìm phòng tồn tại
      const existed = await ChatRoom.findOne({
        type: "private",
        user_ids: {
          $all: [userA, userB],
          $size: 2,
        },
      });

      if (existed) {
        return {
          room: mapChatRoom(existed, userA),
          code: CHAT_ROOM_CODES.CHAT_ROOM_ALREADY_EXISTS,
        };
      }

      const created = await ChatRoom.create({
        type: "private",
        name: null,
        user_ids: [userA, userB],
        admins: [],
        metadata: {
          createdBy: userA,
          updatedBy: userA,
        },
      });
      await created.populate("user_ids", "avatar fullname");
      return {
        room: mapChatRoom(created, userA),
        code: CHAT_ROOM_CODES.CHAT_ROOM_CREATED,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreatePrivateRoom service error:", err);

      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_CREATE_FAILED,
        "Tạo phòng chat thất bại",
        500
      );
    }
  },

  async createPrivateRoomInternal(userA, userB, session) {
    if (userA.toString() === userB.toString()) {
      throw new Error("SELF_ROOM_NOT_ALLOWED");
    }

    // check existed
    const existed = await ChatRoom.findOne({
      type: "private",
      user_ids: { $all: [userA, userB], $size: 2 },
    }).session(session);

    if (existed) return existed;

    // lấy info user để đặt tên
    const users = await User.find({
      _id: { $in: [userA, userB] },
    })
      .select("fullname")
      .session(session);

    const [u1, u2] = users;

    const roomName = `${u1.fullname} & ${u2.fullname}`;

    const [room] = await ChatRoom.create(
      [
        {
          type: "private",
          name: roomName,
          user_ids: [userA, userB],
          metadata: {
            createdBy: userA,
            updatedBy: userA,
          },
        },
      ],
      { session }
    );

    return room;
  },
  async getRoomStats(roomId, userId) {
    await this.assertUserInRoom(roomId, userId);

    const stats = await Message.aggregate([
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          "metadata.deleted.isDeleted": { $ne: true },
        },
      },

      {
        $unwind: {
          path: "$attachments",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: null,

          files: {
            $sum: {
              $cond: [{ $ifNull: ["$attachments", false] }, 1, 0],
            },
          },

          images: {
            $sum: {
              $cond: [{ $eq: ["$attachments.type", "image"] }, 1, 0],
            },
          },

          videos: {
            $sum: {
              $cond: [{ $eq: ["$attachments.type", "video"] }, 1, 0],
            },
          },

          documents: {
            $sum: {
              $cond: [{ $eq: ["$attachments.type", "file"] }, 1, 0],
            },
          },

          links: {
            $sum: {
              $cond: [
                {
                  $regexMatch: {
                    input: "$content",
                    regex: /(https?:\/\/)/i,
                  },
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        files: 0,
        images: 0,
        videos: 0,
        documents: 0,
        links: 0,
      }
    );
  },

  async addMember({ roomId, userId }, currentUser) {
    const room = await ChatRoom.findById(roomId);

    if (!room) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_NOT_FOUND,
        "Không tìm thấy phòng",
        404
      );
    }

    const updatedRoom = await ChatRoom.findByIdAndUpdate(
      roomId,
      { $addToSet: { user_ids: userId } },
      { new: true }
    );

    await saveAuditLogs({
      entityType: "chat_rooms",
      entityId: room._id,
      action: "add_member",
      oldData: {},
      newData: { addedUser: userId },
      updatedBy: currentUser?.id || currentUser?._id,
    });

    return mapChatRoom(updatedRoom, currentUser.id);
  },
  async removeMember({ roomId, userId }, currentUser) {
    const room = await ChatRoom.findById(roomId);

    if (!room) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_NOT_FOUND,
        "Không tìm thấy phòng",
        404
      );
    }

    const isRoomAdmin = room.admins?.some(
      (id) => id.toString() === currentUser.id
    );

    if (!isRoomAdmin) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_FORBIDDEN,
        "Bạn không có quyền xóa thành viên",
        403
      );
    }

    const updatedRoom = await ChatRoom.findOneAndUpdate(
      { _id: roomId, user_ids: userId },
      { $pull: { user_ids: userId } },
      { new: true }
    );

    if (!updatedRoom) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_MEMBER_NOT_FOUND,
        "Thành viên không tồn tại trong phòng",
        404
      );
    }

    await saveAuditLogs({
      entityType: "chat_rooms",
      entityId: room._id,
      action: "remove_member",
      oldData: {},
      newData: { removedUser: userId },
      updatedBy: currentUser?.id || currentUser?._id,
    });

    return mapChatRoom(updatedRoom, currentUser.id);
  },
  async setAdmins({ roomId, adminIds }, currentUser) {
    try {
      const room = await ChatRoom.findById(roomId);

      if (!room) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_NOT_FOUND,
          "Không tìm thấy phòng",
          404
        );
      }

      if (!Array.isArray(adminIds)) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_ADMIN_INVALID,
          "Danh sách admin không hợp lệ",
          400
        );
      }

      // admin phải nằm trong room
      const invalidAdmin = adminIds.find(
        (id) => !room.user_ids.some((u) => u.toString() === id)
      );

      if (invalidAdmin) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_ADMIN_INVALID,
          "Admin phải là thành viên của phòng",
          400
        );
      }

      room.admins = adminIds;
      room.metadata.updatedBy = currentUser?.id || currentUser?._id;

      await room.save();

      await saveAuditLogs({
        entityType: "chat_rooms",
        entityId: room._id,
        action: "set_admins",
        oldData: {},
        newData: {
          admins: adminIds,
        },
        updatedBy: currentUser?.id || currentUser?._id,
      });

      return mapChatRoom(room, currentUser.id);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("SetAdmins service error:", err);
      throw err;
    }
  },

  async muteUser({ roomId, userId }, currentUser) {
    if (!roomId || !userId) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
        "Thiếu roomId hoặc userId",
        400
      );
    }

    const room = await ChatRoom.findById(roomId);

    if (!room) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_NOT_FOUND,
        "Không tìm thấy phòng",
        404
      );
    }

    const currentUserId = currentUser?.id || currentUser?._id;

    // Không cho mute trong private room
    if (room.type === "private") {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
        "Không thể mute trong phòng riêng",
        400
      );
    }

    // User target phải thuộc phòng
    const isMember = room.user_ids.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_USER_NOT_FOUND,
        "User không thuộc phòng",
        404
      );
    }

    // Không tự mute
    if (userId.toString() === currentUserId.toString()) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
        "Không thể tự mute chính mình",
        400
      );
    }

    // Chỉ admin mới được mute
    const isAdmin = room.admins.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (!isAdmin) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_FORBIDDEN,
        "Bạn không có quyền mute",
        403
      );
    }

    // Không được mute owner
    if (room.metadata?.createdBy?.toString() === userId.toString()) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
        "Không thể mute chủ phòng",
        400
      );
    }

    room.metadata = room.metadata || {};
    room.metadata.mutedUsers = room.metadata.mutedUsers || [];

    const isMuted = room.metadata.mutedUsers.some(
      (id) => id.toString() === userId.toString()
    );

    let code;

    if (isMuted) {
      // UNMUTE
      room.metadata.mutedUsers = room.metadata.mutedUsers.filter(
        (id) => id.toString() !== userId.toString()
      );

      code = CHAT_ROOM_CODES.CHAT_ROOM_USER_UNMUTED;
    } else {
      // MUTE
      room.metadata.mutedUsers.push(userId);
      code = CHAT_ROOM_CODES.CHAT_ROOM_USER_MUTED;
    }

    room.metadata.updatedBy = currentUserId;
    await room.save();

    return {
      code,
      room: mapChatRoom(room, currentUser.id),
    };
  },
  async banUser({ roomId, userId }, currentUser) {
    if (!roomId || !userId) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
        "Thiếu roomId hoặc userId",
        400
      );
    }

    const room = await ChatRoom.findById(roomId);

    if (!room) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_NOT_FOUND,
        "Không tìm thấy phòng",
        404
      );
    }

    const currentUserId = currentUser?.id || currentUser?._id;

    if (room.type === "private") {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
        "Không thể ban trong phòng riêng",
        400
      );
    }

    // Không tự ban
    if (userId.toString() === currentUserId.toString()) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
        "Không thể tự ban chính mình",
        400
      );
    }

    // Chỉ admin mới được ban
    const isAdmin = room.admins.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (!isAdmin) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_FORBIDDEN,
        "Bạn không có quyền ban",
        403
      );
    }

    // Không ban owner
    if (room.metadata?.createdBy?.toString() === userId.toString()) {
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
        "Không thể ban chủ phòng",
        400
      );
    }

    room.bannedUsers = room.bannedUsers || [];

    const isBanned = room.bannedUsers.some(
      (id) => id.toString() === userId.toString()
    );

    let code;

    if (isBanned) {
      // UNBAN
      room.bannedUsers = room.bannedUsers.filter(
        (id) => id.toString() !== userId.toString()
      );

      code = CHAT_ROOM_CODES.CHAT_ROOM_USER_UNBANNED;
    } else {
      // BAN

      const isMember = room.user_ids.some(
        (id) => id.toString() === userId.toString()
      );

      if (!isMember) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_USER_NOT_FOUND,
          "User không thuộc phòng",
          404
        );
      }

      room.bannedUsers.push(userId);

      // remove khỏi room
      room.user_ids = room.user_ids.filter(
        (id) => id.toString() !== userId.toString()
      );

      room.admins = room.admins.filter(
        (id) => id.toString() !== userId.toString()
      );

      code = CHAT_ROOM_CODES.CHAT_ROOM_USER_BANNED;
    }

    room.metadata.updatedBy = currentUserId;
    await room.save();

    return {
      code,
      room: mapChatRoom(room, currentUser.id),
    };
  },
  async getChatRoomsForExport({ scope, selectedIds, filters }) {
    let query = {};

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    const chatRooms = await ChatRoom.find(query)
      .populate("course_id", "title")
      .populate("user_ids", "fullname")
      .populate("admins", "fullname")
      .lean();

    return chatRooms;
  },
  async previewExportChatRooms({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateChatRoomExportScope({ scope, selectedIds });

    const chatRooms = await this.getChatRoomsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!chatRooms.length) {
      throw new AppError(
        CHAT_ROOM_CODES.CHATROOM_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = mapChatRoomExportData(chatRooms);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },
  async exportChatRooms({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateChatRoomExportScope({ scope, selectedIds });
    validateChatRoomExportFormat(format);

    const chatRooms = await this.getChatRoomsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!chatRooms.length) {
      throw new AppError(
        CHAT_ROOM_CODES.CHATROOM_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportChatRoomsFile({
      chatRooms,
      format,
    });

    await saveAuditLogs({
      entityType: "chatrooms",
      action: "export",
      entityId: null,
      oldData: {},
      newData: {
        count: chatRooms.length,
        format,
      },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `chatrooms_${Date.now()}.${
        format === "excel" ? "xlsx" : "pdf"
      }`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },

  async findPrivateRoom(userA, userB) {
    const room = await ChatRoom.findOne({
      type: "private",
      user_ids: {
        $all: [userA, userB],
        $size: 2,
      },
    })
      .populate("user_ids", "avatar fullname")
      .lean();

    if (!room) return null;

    return mapChatRoom(room, userA);
  },

  async updateRoomSettings(roomId, data, user) {
    try {
      const { name, type } = data;

      const room = await ChatRoom.findById(roomId);

      if (!room) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_NOT_FOUND,
          "Không tìm thấy phòng",
          404
        );
      }

      const isAdmin = room.admins.some(
        (id) => id.toString() === user.id.toString()
      );

      if (!isAdmin) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_FORBIDDEN,
          "Bạn không có quyền cập nhật phòng",
          403
        );
      }

      if (room.type === "private") {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_INVALID_ACTION,
          "Không thể cập nhật phòng riêng tư",
          400
        );
      }

      const allowedTypes = ["course", "class", "teacher_student", "system"];

      if (type && !allowedTypes.includes(type)) {
        throw new AppError(
          CHAT_ROOM_CODES.CHAT_ROOM_INVALID_TYPE,
          "Loại phòng không hợp lệ",
          400
        );
      }

      if (name) {
        const existed = await ChatRoom.findOne({
          _id: { $ne: roomId },
          name: name.trim(),
          type: type || room.type,
        });

        if (existed) {
          throw new AppError(
            CHAT_ROOM_CODES.CHAT_ROOM_EXISTS,
            "Phòng đã tồn tại",
            409
          );
        }

        room.name = name.trim();
      }

      if (type) {
        room.type = type;
      }
      room.metadata.updatedBy = user.id;
      await room.save();

      return mapChatRoom(room, user.id);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("UpdateRoomSettings service error:", err);

      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_UPDATE_FAILED,
        "Cập nhật phòng thất bại",
        500
      );
    }
  },
  async getUserRooms(userId) {
    const rooms = await ChatRoom.find({
      user_ids: userId,
    })
      .select("_id")
      .lean();

    return rooms.map((room) => ({
      id: room._id.toString(),
    }));
  },
  async removeManyChatRooms(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        CHAT_ROOM_CODES.CHATROOM_DELETE_EMPTY_IDS,
        "Không có phòng chat để xóa",
        400
      );
    }

    // 1. Lấy dữ liệu cũ
    const rooms = await ChatRoom.find({ _id: { $in: ids } });

    // 2. Check missing
    if (rooms.length !== ids.length) {
      const foundIds = rooms.map((r) => r._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_NOT_FOUND,
        `Không tìm thấy phòng: ${notFoundIds.join(", ")}`,
        404
      );
    }

    // 3. Map old data (chuẩn hoá giống mapCourse)
    const mappedOld = rooms.map((room) => mapChatRoom(room, actor?.id));

    // 4. Delete
    await ChatRoom.deleteMany({ _id: { $in: ids } });

    // 5. Audit log
    await Promise.all(
      rooms.map((room, index) =>
        saveAuditLogs({
          entityType: "chatRooms",
          entityId: room._id,
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
};

export default ChatRoomModel;
