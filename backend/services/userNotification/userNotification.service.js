import UserNotification from "../../models/chat/userNotification.model.js";
import ChatRoom from "../../models/chat/chatRoom.model.js";
import { CHAT_ROOM_CODES } from "../../constants/chatRoom.codes.js";
import mongoose from "mongoose";

const UserNotificationService = {
  async increaseUnreadForRoom({ roomId, excludeUserId }, session) {
    const room = await ChatRoom.findById(roomId)
      .select("_id user_ids")
      .session(session);
    if (!room) throw new Error("CHAT_ROOM_NOT_FOUND");

    // Loại bỏ sender
    const receivers = room.user_ids.filter(
      (id) => id.toString() !== excludeUserId.toString()
    );

    // Chỉ cập nhật cho receivers
    if (receivers.length === 0) return true;

    const now = new Date();

    const ops = receivers.map((userId) => ({
      updateOne: {
        filter: { roomId, userId },
        update: { $inc: { unreadCount: 1 }, $set: { updatedAt: now } },
        upsert: true,
      },
    }));

    await UserNotification.bulkWrite(ops, { session });
    return true;
  },
  async markAsRead({ roomId, userId }) {
    const room = await ChatRoom.findById(roomId).select(
      "metadata.lastMessageId user_ids"
    );
    if (!room)
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_NOT_FOUND,
        "Phòng không tồn tại",
        404
      );

    const isMember = room.user_ids.some(
      (id) => id.toString() === userId.toString()
    );
    if (!isMember)
      throw new AppError(
        CHAT_ROOM_CODES.CHAT_ROOM_FORBIDDEN,
        "Bạn không thuộc phòng này",
        403
      );

    await UserNotification.findOneAndUpdate(
      { roomId, userId },
      {
        $set: {
          unreadCount: 0,
          lastReadMessageId: room.metadata?.lastMessageId || null,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return {
      roomId,
      lastReadMessageId: room.metadata?.lastMessageId?.toString() || null,
    };
  },

  async getChatUserNotifications(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const data = await UserNotification.aggregate([
      {
        $match: { userId: userObjectId },
      },

      // join ChatRoom
      {
        $lookup: {
          from: "chatrooms",
          localField: "roomId",
          foreignField: "_id",
          as: "room",
        },
      },

      // tránh mất data nếu room null
      {
        $unwind: {
          path: "$room",
          preserveNullAndEmptyArrays: true,
        },
      },

      // lấy lastMessageId
      {
        $addFields: {
          lastMessageId: "$room.metadata.lastMessageId",
        },
      },

      // tính isUnread chuẩn
      {
        $addFields: {
          isUnread: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$lastMessageId", null] },
                  {
                    $or: [
                      { $eq: ["$lastReadMessageId", null] },
                      { $lt: ["$lastReadMessageId", "$lastMessageId"] },
                    ],
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },

      // fix unreadCount nếu lệch
      {
        $addFields: {
          unreadCount: {
            $cond: {
              if: "$isUnread",
              then: "$unreadCount",
              else: 0,
            },
          },
        },
      },

      // format output
      {
        $project: {
          _id: 1,
          roomId: 1,
          userId: 1,
          unreadCount: 1,
          isUnread: 1,
          lastReadMessageId: 1,
          lastMessageId: 1,
          muted: 1,
          priorityScore: 1,
          updatedAt: 1,
        },
      },

      {
        $sort: { updatedAt: -1 },
      },
    ]);

    return data;
  },
};

export default UserNotificationService;
