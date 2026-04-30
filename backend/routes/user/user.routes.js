import express from "express";
import { userController } from "../../controllers/user/user.controller.js";
import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  optionalAuthenticate,
  ROLES,
} from "../../middlewares/auth.js";
import {
  selfProfileUpdateSchema,
  userCreateSchema,
} from "../../validators/user/user.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { NotificationController } from "../../controllers/notifications/notification.controller.js";

const router = express.Router();

router.get(
  "/profile/:slug",
  optionalAuthenticate,
  userController.getProfileBySlug
);

router.use(authenticate);
router.patch("/preferences", userController.updatePreferences);
router.patch(
  "/notification-settings",
  NotificationController.updateNotificationSettings
);

router.get("/search", userController.searchUsers);

router.put(
  "/me",
  authorizePermission("users.update"),
  validateRequest(selfProfileUpdateSchema),
  userController.updateMyProfile
);
router.get("/profile", userController.getMyProfile);

router.use(authorize(ROLES.ADMIN));

router.get("/", authorizePermission("users.read"), userController.listUsers);

router.post(
  "/",
  authorizePermission("users.create"),
  validateRequest(userCreateSchema),
  userController.createUser
);

router.post(
  "/bulk",
  authorizePermission("users.create"),
  userController.createMany
);

router.put(
  "/:id",
  authorizePermission("users.update"),
  userController.adminFormUpdate
);

router.patch(
  "/:id/inline",
  authorizePermission("users.update"),
  userController.adminInlineUpdate
);

router.post(
  "/delete-many",
  authorizePermission("users.delete"),
  userController.removeMany
);

router.post(
  "/export/preview",
  authorizePermission("users.export"),
  userController.previewExportUsers
);

router.post(
  "/export",
  authorizePermission("users.export"),
  noCompression,
  userController.exportUsers
);

export default router;
