import mongoose from "mongoose";
import Message from "../../models/chat/message.model.js";
import ChatRoomService from "../chat/chatRoom.service.js";
import ChatRoom from "../../models/chat/chatRoom.model.js";

import UserNotification from "../../services/userNotification/userNotification.service.js";
import UserBlockService from "../../services/userBlock/userBlockService.js";

import { MESSAGE_CODES } from "../../constants/message.codes.js";
import AppError from "../../utils/AppError.js";

export const mapMessage = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  const isPopulatedSender =
    typeof doc.senderId === "object" && doc.senderId !== null;

  const isPopulatedReply =
    typeof doc.replyTo === "object" && doc.replyTo !== null;

  const isPopulatedRoom = typeof doc.roomId === "object" && doc.roomId !== null;

  return {
    id: doc._id?.toString(),

    roomId: isPopulatedRoom
      ? doc.roomId._id.toString()
      : doc.roomId?.toString(),

    sender: isPopulatedSender
      ? {
          id: doc.senderId._id.toString(),
          name: doc.senderId.name,
          avatar: doc.senderId.avatar,
        }
      : {
          id: doc.senderId?.toString(),
        },

    content: doc.content,
    messageType: doc.messageType,

    attachments: (doc.attachments || []).map((att) => ({
      type: att.type,
      url: att.url,
      filename: att.filename,
      size: att.size,
      thumbnailUrl: att.thumbnailUrl,
    })),

    reactions: (doc.reactions || []).map((reaction) => ({
      userId:
        typeof reaction.userId === "object"
          ? reaction.userId._id.toString()
          : reaction.userId?.toString(),
      reaction: reaction.reaction,
    })),

    replyTo: isPopulatedReply
      ? {
          id: doc.replyTo._id.toString(),
          content: doc.replyTo.content,
          senderName: doc.replyTo.senderId?.name,
        }
      : doc.replyTo
      ? { id: doc.replyTo.toString() }
      : null,

    metadata: {
      edited: doc.metadata?.edited || false,
      deleted: doc.metadata?.deleted?.isDeleted || false,
      deletedAt: doc.metadata?.deleted?.deletedAt || null,
      deletedBy: doc.metadata?.deleted?.deletedBy?.toString() || null,
    },

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export function buildMessageFilter({ roomId, search, type }) {
  const filter = {};

  if (roomId) {
    filter.roomId = roomId;
  }

  if (type && type !== "All") {
    filter.type = type;
  }

  if (search) {
    filter.content = {
      $regex: search,
      $options: "i",
    };
  }

  return filter;
}
export function buildMessageSort() {
  return { _id: -1 };
}
const MAX_SIZE = {
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  audio: 20 * 1024 * 1024, // 20MB
  file: 20 * 1024 * 1024, // 20MB
  raw: 50 * 1024 * 1024,
};

const ALLOWED_TYPES = ["image", "video", "audio", "file", "raw"];
const MessageService = {
  async sendMessage({
    roomId,
    senderId,
    content = "",
    attachments = [],
    replyTo = null,
  }) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await ChatRoomService.assertUserInRoom(roomId, senderId);

      const room = await ChatRoom.findById(roomId)
        .select("user_ids type")
        .session(session);

      // ✅ CHỈ CHECK BLOCK nếu private room
      if (room.type === "private") {
        const receiver = room.user_ids.find(
          (id) => id.toString() !== senderId.toString()
        );

        const block = await UserBlockService.getBlockBetween(
          senderId,
          receiver
        );

        if (block) {
          throw new AppError("USER_BLOCKED", "Conversation is blocked", 403);
        }
      }

      const receivers = room.user_ids.filter(
        (id) => id.toString() !== senderId.toString()
      );

      const hasAttachment = attachments.length > 0;
      attachments.forEach((att) => {
        if (!att.url) {
          throw new AppError("FILE_INVALID", "Attachment URL missing", 400);
        }

        if (!ALLOWED_TYPES.includes(att.type)) {
          throw new AppError("FILE_TYPE_INVALID", "Unsupported file type", 400);
        }

        const limit = MAX_SIZE[att.type] || MAX_SIZE.raw;

        if (att.size && att.size > limit) {
          throw new AppError(
            "FILE_TOO_LARGE",
            `File exceeds ${limit} bytes`,
            400
          );
        }
      });

      if (!content && !hasAttachment) {
        throw new AppError(MESSAGE_CODES.MESSAGE_EMPTY, "Tin nhắn rỗng", 400);
      }

      let replyMessage = null;

      if (replyTo) {
        replyMessage = await Message.findOne({
          _id: replyTo,
          roomId,
        }).session(session);

        if (!replyMessage) {
          throw new AppError(
            MESSAGE_CODES.REPLY_INVALID,
            "Tin nhắn trả lời không hợp lệ",
            400
          );
        }
      }

      let messageType = "text";

      if (hasAttachment && content) messageType = "mixed";
      else if (hasAttachment) messageType = "attachment";

      const message = await Message.create(
        [
          {
            roomId,
            senderId,
            content,
            attachments,
            messageType,
            replyTo,
          },
        ],
        { session }
      );

      await ChatRoom.updateOne(
        { _id: roomId },
        {
          $set: {
            "metadata.lastMessageId": message[0]._id,
            updated_at: new Date(),
          },
        },
        { session }
      );

      await UserNotification.increaseUnreadForRoom(
        {
          roomId,
          excludeUserId: senderId,
        },
        session
      );

      const hydrated = await Message.findById(message[0]._id)
        .populate("senderId", "name avatar")
        .populate({
          path: "replyTo",
          select: "content senderId",
          populate: {
            path: "senderId",
            select: "name",
          },
        })
        .session(session)
        .lean();

      await session.commitTransaction();

      return {
        message: hydrated,
        receivers,
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async listAdminMessagesUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = buildMessageFilter({
      roomId: query.roomId,
      search: query.search,
      type: query.type,
    });

    const [docs, total] = await Promise.all([
      Message.find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("senderId", "name avatar")
        .populate("roomId", "name type")
        .lean(),

      Message.countDocuments(filter),
    ]);

    return {
      data: docs.map(mapMessage),
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
  async listRoomMessagesUseCase({ roomId, userId, limit = 20, cursor = null }) {
    await ChatRoomService.assertUserInRoom(roomId, userId);

    const filter = buildMessageFilter({ roomId });

    // cursor pagination
    if (cursor) {
      filter._id = {
        $lt: new mongoose.Types.ObjectId(cursor),
      };
    }

    const docs = await Message.find(filter)
      .sort(buildMessageSort())
      .limit(limit + 1)
      .populate("senderId", "name avatar")
      .populate("replyTo", "content senderId")
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map(mapMessage);

    return {
      data,
      pagination: {
        limit,
        hasNext,
        nextCursor: hasNext ? data[data.length - 1].id : null,
      },
    };
  },

  async softDeleteMessage(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new Error("FORBIDDEN_DELETE_MESSAGE");
    }

    message.metadata.deleted = {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
    };

    await message.save();

    const populated = await Message.findById(messageId)
      .populate("senderId", "name avatar")
      .lean();

    // 🔥 map ngay trong service
    return mapMessage(populated);
  },

  async addReaction(messageId, userId, reaction) {
    const message = await Message.findById(messageId);

    if (!message) throw new Error("MESSAGE_NOT_FOUND");

    await ChatRoomService.assertUserInRoom(message.roomId, userId);

    const existing = message.reactions.find(
      (r) => r.userId.toString() === userId.toString()
    );

    // CASE 1: cùng icon => bỏ reaction
    if (existing && existing.reaction === reaction) {
      await Message.updateOne(
        { _id: messageId },
        { $pull: { reactions: { userId } } }
      );
    }

    // CASE 2: khác icon => đổi icon
    else if (existing) {
      await Message.updateOne(
        { _id: messageId, "reactions.userId": userId },
        {
          $set: {
            "reactions.$.reaction": reaction,
          },
        }
      );
    }

    // CASE 3: chưa có => thêm mới
    else {
      await Message.updateOne(
        {
          _id: messageId,
          reactions: {
            $not: { $elemMatch: { userId } },
          },
        },
        {
          $push: {
            reactions: { userId, reaction },
          },
        }
      );
    }

    const updated = await Message.findById(messageId).lean();

    return updated.reactions;
  },
};

export default MessageService;
