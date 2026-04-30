import express from "express";
import { ContactController } from "../../controllers/contact/contact.controller.js";
import {
  authenticate,
  authorize,
  authorizePermission,
  ROLES,
} from "../../middlewares/auth.js";

const router = express.Router();

router.post("/", ContactController.create);
router.use(authenticate);

router.get(
  "/",
  authorizePermission("contacts.read"),
  authorize(ROLES.ADMIN),

  ContactController.list
);
router.patch(
  "/:id/status",
  authorizePermission("contacts.update"),
  authorize(ROLES.ADMIN),
  ContactController.updateStatus
);

router.post(
  "/delete-many",
  authorizePermission("contacts.delete"),
  ContactController.removeMany
);
export default router;
