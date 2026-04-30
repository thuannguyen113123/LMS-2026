import UserBlock from "../../models/chat/userBlock.model.js";
import AppError from "../../utils/AppError.js";
import { USER_BLOCK_CODES } from "../../constants/userBlock.codes.js";

const UserBlockService = {
  async getBlockBetween(userA, userB) {
    return UserBlock.findOne({
      $or: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    }).lean();
  },

  async isBlockedBetween(userA, userB) {
    const block = await this.getBlockBetween(userA, userB);
    return !!block;
  },
  async getMyBlocks(userId) {
    return UserBlock.find({
      $or: [{ blockerId: userId }, { blockedId: userId }],
    }).lean();
  },

  async blockUser(blockerId, blockedId) {
    if (blockerId.toString() === blockedId.toString()) {
      throw new AppError(
        USER_BLOCK_CODES.BLOCK_ACTION_FORBIDDEN,
        "Không thể tự block chính mình",
        400
      );
    }

    try {
      await UserBlock.create({
        blockerId,
        blockedId,
      });

      return {
        blockerId: blockerId.toString(),
        blockedUserId: blockedId.toString(),
        isBlocked: true,
      };
    } catch (err) {
      if (err.code === 11000) {
        // đã block rồi → idempotent
        return {
          blockerId: blockerId.toString(),
          blockedUserId: blockedId.toString(),
          isBlocked: true,
        };
      }

      throw err;
    }
  },

  async unblockUser(blockerId, blockedId) {
    if (blockerId.toString() === blockedId.toString()) {
      throw new AppError(
        USER_BLOCK_CODES.BLOCK_ACTION_FORBIDDEN,
        "Không thể tự unblock chính mình",
        400
      );
    }

    await UserBlock.deleteOne({
      blockerId,
      blockedId,
    });

    return {
      blockerId: blockerId.toString(),
      blockedUserId: blockedId.toString(),
      isBlocked: false,
    };
  },
};

export default UserBlockService;
