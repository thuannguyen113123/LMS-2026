import mongoose from "mongoose";
import ChatRequest from "../../models/chat/chatRequest.model.js";
import ChatRoomService from "../chat/chatRoom.service.js";

function buildPairKey(a, b) {
  return [a.toString(), b.toString()].sort().join("_");
}
export const mapChatRequest = (doc) => {
  if (!doc) return null;

  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    fromUser: doc.fromUserId
      ? {
          id: doc.fromUserId._id?.toString() || doc.fromUserId.toString(),
          fullname: doc.fromUserId.fullname,
          avatar: doc.fromUserId.avatar,
        }
      : null,

    toUser: doc.toUserId
      ? {
          id: doc.toUserId._id?.toString() || doc.toUserId.toString(),
          fullname: doc.toUserId.fullname,
          avatar: doc.toUserId.avatar,
        }
      : null,

    status: doc.status,

    privateRoomId: doc.privateRoomId ? doc.privateRoomId.toString() : null,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
const ChatRequestService = {
  async sendRequest({ fromUserId, toUserId }) {
    if (fromUserId.toString() === toUserId.toString()) {
      throw new Error("CANNOT_REQUEST_SELF");
    }

    const existedRoom = await ChatRoomService.findPrivateRoom(
      fromUserId,
      toUserId
    );

    if (existedRoom) {
      return {
        room: existedRoom,
        code: "ROOM_EXISTS",
      };
    }

    const pairKey = buildPairKey(fromUserId, toUserId);

    try {
      let request = await ChatRequest.create({
        fromUserId,
        toUserId,
        pairKey,
      });

      // QUAN TRỌNG — populate lại
      request = await request.populate([
        { path: "fromUserId", select: "fullname avatar" },
        { path: "toUserId", select: "fullname avatar" },
      ]);

      return {
        request: mapChatRequest(request),
        code: "REQUEST_SENT",
      };
    } catch (err) {
      if (err.code === 11000) {
        throw new Error("REQUEST_EXISTS");
      }

      throw err;
    }
  },

  async acceptRequest(requestId, userId) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const request = await ChatRequest.findById(requestId).session(session);

      if (!request) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      if (request.status !== "pending") {
        throw new Error("REQUEST_ALREADY_PROCESSED");
      }

      // chỉ receiver mới accept được
      if (request.toUserId.toString() !== userId.toString()) {
        throw new Error("FORBIDDEN_ACCEPT_REQUEST");
      }

      // create private room
      const room = await ChatRoomService.createPrivateRoomInternal(
        request.fromUserId,
        request.toUserId,
        session
      );

      // update request
      request.status = "accepted";
      request.privateRoomId = room._id;

      await request.save({ session });

      await session.commitTransaction();

      return {
        room,
        code: "REQUEST_ACCEPTED",
        message: "Đã tạo phòng trò chuyện thành công",
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async rejectRequest(requestId, userId) {
    const request = await ChatRequest.findById(requestId);

    if (!request) throw new Error("REQUEST_NOT_FOUND");

    if (request.toUserId.toString() !== userId.toString()) {
      throw new Error("FORBIDDEN_REJECT_REQUEST");
    }

    if (request.status !== "pending") {
      throw new Error("REQUEST_ALREADY_PROCESSED");
    }

    request.status = "rejected";
    await request.save();

    return {
      code: "REQUEST_REJECTED",
      fromUserId: request.fromUserId.toString(),
      toUserId: request.toUserId.toString(),
    };
  },
  async getUserRequests(userId) {
    const requests = await ChatRequest.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    })
      .populate("fromUserId", "fullname avatar")
      .populate("toUserId", "fullname avatar")
      .sort({ createdAt: -1 });

    return requests.map(mapChatRequest);
  },
};

export default ChatRequestService;
