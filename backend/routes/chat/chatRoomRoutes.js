import express from "express";
import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import { chatRoomController } from "../../controllers/chat/chatRoom.controller.js";
import { messageController } from "../../controllers/chat/message.controller.js";

import {
  addMemberSchema,
  createPrivateRoomSchema,
  createRoomSchema,
  removeMemberSchema,
  setAdminsSchema,
  updateRoomSchema,
} from "../../validators/chat/chatRoomValidator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/public",
  authorizePermission("chatrooms.read"),
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  chatRoomController.listUserRooms
);
router.get(
  "/",
  authorizePermission("chatrooms.read"),
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  chatRoomController.list
);

router.get(
  "/:roomId/members",
  authorizePermission("chatrooms.read"),
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  chatRoomController.listRoomMembers
);

router.post(
  "/add-member",
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("chatrooms.create"),
  validateRequest(addMemberSchema),
  chatRoomController.addMember
);

router.post(
  "/remove-member",
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("chatrooms.delete"),
  validateRequest(removeMemberSchema),

  chatRoomController.removeMember
);
router.post(
  "/set-admins",
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("chatrooms.update"),
  validateRequest(setAdminsSchema),
  chatRoomController.setAdmins
);
router.post(
  "/:roomId/mute",
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("chatrooms.update"),

  chatRoomController.muteUser
);
router.post(
  "/:roomId/ban",
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("chatrooms.update"),
  chatRoomController.banUser
);

router.post(
  "/",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  authorizePermission("chatrooms.create"),
  validateRequest(createRoomSchema),

  chatRoomController.create
);

router.get("/:roomId/stats", chatRoomController.getRoomStats);

router.post(
  "/private",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  authorizePermission("chatrooms.create"),
  validateRequest(createPrivateRoomSchema),

  chatRoomController.createPrivateRoom
);

router.get("/:roomId/messages", messageController.listRoomMessages);
router.put(
  "/admin/:roomId/settings",
  validateRequest(updateRoomSchema),
  chatRoomController.updateSettings
);

router.post(
  "/export/preview",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("chatrooms.export"),
  chatRoomController.previewExportChatRooms
);

router.post(
  "/export",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("chatrooms.export"),
  noCompression,
  chatRoomController.exportChatRooms
);

router.post(
  "/delete-many",
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("chatrooms.delete"),
  chatRoomController.removeMany
);

export default router;
