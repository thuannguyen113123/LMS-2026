import mongoose from "mongoose";
import User from "../../models/user/user.model.js";
import ChatRoom from "../../models/chat/chatRoom.model.js";
import ChatRequest from "../../models/chat/chatRequest.model.js";

const ChatSuggestionService = {
  async getSuggestions(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // lấy private rooms đã chat
    const rooms = await ChatRoom.find({
      type: "private",
      user_ids: userObjectId,
    }).select("user_ids");

    const chattedUserIds = new Set();

    rooms.forEach((room) => {
      room.user_ids.forEach((id) => {
        if (id.toString() !== userId.toString()) {
          chattedUserIds.add(id.toString());
        }
      });
    });

    // lấy chat request liên quan
    const requests = await ChatRequest.find({
      $or: [{ fromUserId: userObjectId }, { toUserId: userObjectId }],
    }).lean();

    const requestMap = new Map();

    requests.forEach((req) => {
      const otherUserId =
        req.fromUserId.toString() === userId.toString()
          ? req.toUserId.toString()
          : req.fromUserId.toString();

      requestMap.set(otherUserId, req.status);
    });

    // aggregate user suggestions
    const users = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: userObjectId,
            $nin: [...chattedUserIds].map(
              (id) => new mongoose.Types.ObjectId(id)
            ),
          },
          locked: { $ne: true },
        },
      },

      {
        $addFields: {
          chattedBefore: {
            $in: [{ $toString: "$_id" }, [...chattedUserIds]],
          },
        },
      },

      {
        $addFields: {
          priorityScore: {
            $add: [{ $cond: ["$chattedBefore", 50, 0] }],
          },
        },
      },

      {
        $sort: { priorityScore: -1 },
      },

      {
        $limit: 10,
      },

      {
        $project: {
          fullname: 1,
          avatar: 1,
          role_ids: 1,
        },
      },
    ]);

    // map response
    const mapped = users.map((user) => {
      const uid = user._id.toString();

      return {
        id: uid,
        fullname: user.fullname,
        avatar: user.avatar,
        role: user.active_role_id?.name || null,
        requestStatus: requestMap.get(uid) || "none",

        hasRoom: chattedUserIds.has(uid),
      };
    });

    return mapped;
  },
};

export default ChatSuggestionService;
