import express from "express";
import {
  authenticate,
  authorize,
  authorizePermission,
  ROLES,
} from "../../middlewares/auth.js";
import { categoryController } from "../../controllers/category/category.controller.js";
import {
  categoryArraySchema,
  categorySchema,
  updateCategorySchema,
} from "../../validators/category/category.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { courseController } from "../../controllers/coures/course.controller.js";

const router = express.Router();

// 👉 Lấy tất cả khóa học theo slug danh mục
router.get("/:slug/courses", courseController.list);

router.get("/public", categoryController.listPublic);

router.use(authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN));

// Tạo danh mục
router.post(
  "/",
  authorizePermission("categories.create"),
  validateRequest(categorySchema),
  categoryController.create
);
//tạo nhiều danh mục bằng import
router.post(
  "/bulk",
  authorizePermission("categories.create"),
  validateRequest(categoryArraySchema),
  categoryController.createMany
);
router.put(
  "/:id",
  authorizePermission("categories.update"),
  validateRequest(updateCategorySchema),
  categoryController.update
);

router.get("/options", categoryController.options);

// Lấy tất cả danh mục
router.get(
  "/",
  authorizePermission("categories.read"),
  categoryController.list
);

router.post(
  "/delete-many",
  authorizePermission("categories.delete"),

  categoryController.removeMany
);
router.post(
  "/export/preview",
  authorizePermission("categories.export"),
  categoryController.previewExportCategories
);

router.post(
  "/export",
  authorizePermission("categories.export"),
  categoryController.exportCategories
);

export default router;
