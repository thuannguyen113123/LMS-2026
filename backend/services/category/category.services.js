import { CATEGORY_CODES } from "../../constants/category.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import Category from "../../models/category/Category.js";
import AppError from "../../utils/AppError.js";
import { makeSlug } from "../../utils/slug.js";
import { exportCategories } from "./category.export.js";

export const validateExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      CATEGORY_CODES.CATEGORY_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      CATEGORY_CODES.CATEGORY_EXPORT_SELECTED_EMPTY,
      "Chưa chọn danh mục để export",
      400
    );
  }
};

export const validateExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      CATEGORY_CODES.CATEGORY_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};

export const mapCategory = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  const mapUser = (user) => {
    if (!user) return null;

    return {
      id: user._id?.toString(),
      name: user.fullname || "",
    };
  };

  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    slug: doc.slug,
    status: doc.status,

    createdBy: mapUser(doc.createdBy),
    updatedBy: mapUser(doc.updatedBy),

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export function buildCategoryFilter(query) {
  const filter = {};

  /** SEARCH */
  if (query.search?.trim()) {
    const keyword = query.search.trim();

    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { slug: { $regex: keyword, $options: "i" } },
    ];
  }

  /** STATUS FILTER */
  if (query.status) {
    filter.status = query.status;
  }

  /** SLUG FILTER */
  if (query.slug) {
    filter.slug = query.slug;
  }

  /** DATE RANGE */
  if (query.createdFrom || query.createdTo) {
    filter.createdAt = {};

    if (query.createdFrom) {
      filter.createdAt.$gte = new Date(query.createdFrom);
    }

    if (query.createdTo) {
      filter.createdAt.$lte = new Date(query.createdTo);
    }
  }

  return filter;
}
export function buildCategorySort(query) {
  switch (query.sort) {
    case "name_asc":
      return { name: 1, _id: 1 };

    case "name_desc":
      return { name: -1, _id: -1 };

    case "oldest":
      return { createdAt: 1, _id: 1 };

    case "latest":
      return { createdAt: -1, _id: -1 };

    default:
      return { createdAt: -1, _id: -1 };
  }
}

const CategoryService = {
  async createCategory(data, user) {
    try {
      const name = data.name.trim();

      // duplicate check
      const existed = await Category.findOne({ name });
      if (existed) {
        throw new AppError(
          CATEGORY_CODES.CATEGORY_EXISTS,
          "Danh mục đã tồn tại",
          409
        );
      }

      const created = await Category.create({
        ...data,
        name,
      });

      // audit log trong service
      await saveAuditLogs({
        entityType: "categories",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: {
          name: created.name,
          status: created.status,
        },
        updatedBy: user?.id || user?._id,
      });

      // service trả object đã map
      return mapCategory(created);
    } catch (err) {
      if (err instanceof AppError) throw err;

      throw new AppError(
        CATEGORY_CODES.CATEGORY_CREATE_FAILED,
        "Tạo danh mục thất bại",
        500
      );
    }
  },

  async createManyCategories(inputList = [], user) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        CATEGORY_CODES.CATEGORY_BULK_INVALID_PAYLOAD,
        "Danh sách danh mục không hợp lệ",
        400
      );
    }

    const userId = user?.id || user?._id;

    const validItems = [];
    const errors = [];

    inputList.forEach((item, index) => {
      if (!item?.name || !item.name.trim()) {
        errors.push({
          index,
          code: CATEGORY_CODES.CATEGORY_BULK_VALIDATION_FAILED,
          name: null,
          reason: ["Tên danh mục không được để trống"],
        });
        return;
      }

      validItems.push({
        index,
        name: item.name.trim(),
        description: item.description || "",
        status: item.status || "active",
      });
    });

    const seen = new Set();
    const uniqueItems = [];

    validItems.forEach((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        errors.push({
          code: CATEGORY_CODES.CATEGORY_BULK_DUPLICATE_IN_FILE,
          name: item.name,
          reason: ["Danh mục bị trùng trong file import"],
        });
      } else {
        seen.add(key);
        uniqueItems.push(item);
      }
    });

    const names = uniqueItems.map((i) => i.name);
    const existed = await Category.find({
      name: { $in: names },
    })
      .collation({ locale: "vi", strength: 2 })
      .select("name")
      .lean();

    const existedSet = new Set(existed.map((c) => c.name.toLowerCase()));

    const toCreate = [];
    const skipped = [];

    uniqueItems.forEach((item) => {
      if (existedSet.has(item.name.toLowerCase())) {
        skipped.push({
          code: CATEGORY_CODES.CATEGORY_EXISTS,
          name: item.name,
        });
      } else {
        toCreate.push({
          name: item.name,
          description: item.description,
          status: item.status,
          createdBy: userId,
          updatedBy: userId,
        });
      }
    });

    if (toCreate.length === 0) {
      return {
        created: [],
        skipped,
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          skipped: skipped.length,
          failed: errors.length,
        },
      };
    }

    const createdDocs = await Category.insertMany(toCreate, {
      ordered: false,
    });

    await Promise.all(
      createdDocs.map((doc) =>
        saveAuditLogs({
          entityType: "categories",
          entityId: doc._id,
          action: "create",
          oldData: {},
          newData: {
            name: doc.name,
            status: doc.status,
          },
          updatedBy: userId,
        })
      )
    );

    return {
      created: createdDocs.map(mapCategory),
      skipped,
      errors,
      summary: {
        total: inputList.length,
        created: createdDocs.length,
        skipped: skipped.length,
        failed: errors.length,
      },
    };
  },

  async listAdminCategoriesUseCase({ query }) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 10, 100);

    const skip = (page - 1) * limit;

    const filter = buildCategoryFilter(query);
    const sort = buildCategorySort(query);

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "fullname")
        .populate("updatedBy", "fullname")
        .lean(),

      Category.countDocuments(filter),
    ]);

    return {
      data: categories.map(mapCategory),
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
  async listPublicCategoriesUseCase({ query }) {
    const limit = Number(query.limit) || 12;
    const cursor = query.cursor;

    const filter = {};

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const docs = await Category.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map(mapCategory);

    return {
      data,

      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },
  async getCategoryOptions() {
    try {
      const docs = await Category.find({ status: "active" })
        .select("_id name slug")
        .sort({ name: 1 })
        .lean();

      return docs.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
      }));
    } catch (err) {
      console.error("getCategoryOptions error:", err);

      throw new AppError(
        CATEGORY_CODES.CATEGORY_LIST_FAILED,
        "Không thể lấy category options",
        500
      );
    }
  },

  async updateCategory(id, data, user) {
    try {
      // 1️⃣ Check tồn tại
      const oldDoc = await Category.findById(id);
      if (!oldDoc) {
        throw new AppError(
          CATEGORY_CODES.CATEGORY_NOT_FOUND,
          "Không tìm thấy danh mục",
          404
        );
      }

      // 2️⃣ Normalize name + slug
      if (data.name) {
        const name = data.name.trim();
        const slug = makeSlug(name);

        const existed = await Category.findOne({
          slug,
          _id: { $ne: id },
        });

        if (existed) {
          throw new AppError(
            CATEGORY_CODES.CATEGORY_EXISTS,
            "Danh mục đã tồn tại",
            409
          );
        }

        data.name = name;
        data.slug = slug;
      }

      // ✅ đúng theo schema
      if (data.status) {
        data.status = data.status.toLowerCase().trim();
      }

      // 4️⃣ updatedBy cast an toàn
      if (user?._id || user?.id) {
        data.updatedBy = user._id || user.id;
      }

      // 5️⃣ Update
      const updated = await Category.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .populate("createdBy", "fullname")
        .populate("updatedBy", "fullname")
        .lean();

      if (!updated) {
        throw new AppError(
          CATEGORY_CODES.CATEGORY_NOT_FOUND,
          "Không tìm thấy danh mục sau khi cập nhật",
          404
        );
      }

      // 6️⃣ Audit log
      await saveAuditLogs({
        entityType: "categories",
        entityId: id,
        action: "update",
        oldData: mapCategory(oldDoc),
        newData: mapCategory(updated),
        updatedBy: user?._id || user?.id,
      });

      return mapCategory(updated);
    } catch (err) {
      // 🔥 LOG lỗi gốc — quan trọng
      console.error("❌ updateCategory REAL ERROR:", err);

      // duplicate key
      if (err?.code === 11000) {
        throw new AppError(
          CATEGORY_CODES.CATEGORY_EXISTS,
          "Danh mục đã tồn tại",
          409
        );
      }

      // mongoose validation
      if (err.name === "ValidationError") {
        throw new AppError(
          CATEGORY_CODES.CATEGORY_INVALID_DATA,
          err.message,
          400
        );
      }

      if (err instanceof AppError) throw err;

      throw new AppError(
        CATEGORY_CODES.CATEGORY_UPDATE_FAILED,
        err.message || "Cập nhật danh mục thất bại",
        500
      );
    }
  },

  async deleteManyCategories(ids = [], user) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError(
          CATEGORY_CODES.CATEGORY_DELETE_EMPTY_IDS,
          "Không có danh mục để xóa",
          400
        );
      }

      const docs = await Category.find({ _id: { $in: ids } });

      if (docs.length !== ids.length) {
        const foundIds = docs.map((d) => d._id.toString());
        const notFound = ids.filter((id) => !foundIds.includes(id));

        throw new AppError(
          CATEGORY_CODES.CATEGORY_DELETE_PARTIAL_NOT_FOUND,
          `Không tìm thấy: ${notFound.join(", ")}`,
          404
        );
      }

      await Category.deleteMany({ _id: { $in: ids } });

      // ✅ audit log trong service
      await Promise.all(
        docs.map((doc) =>
          saveAuditLogs({
            entityType: "categories",
            entityId: doc._id,
            action: "delete",
            oldData: mapCategory(doc),
            newData: {},
            updatedBy: user?.id || user?._id,
          })
        )
      );

      return {
        deletedIds: ids,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      throw new AppError(
        CATEGORY_CODES.CATEGORY_DELETE_FAILED,
        "Xóa danh mục thất bại",
        500
      );
    }
  },
  // 🧭 Thêm truy vấn chuẩn format: lấy danh mục + khóa học theo slug
  async findBySlugWithCourses(slug) {
    const category = await Category.findOne({ slug }).lean();
    if (!category) return null;

    // 🔹 Sử dụng _id để query courses
    const courses = await Course.find({ category: category._id }).lean();

    return {
      ...category,
      courses,
    };
  },

  /* ---------- Export ---------- */
  async getCategoriesForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Category.find(query).sort({ createdAt: -1 }).lean();
  },

  async previewExportCategories({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateExportScope({ scope, selectedIds });

    const categories = await this.getCategoriesForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!categories.length) {
      throw new AppError(
        CATEGORY_CODES.CATEGORY_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mappedCategories = categories.map(mapCategory);

    return {
      total: mappedCategories.length,
      columns: ["name", "slug", "status", "description", "createdAt"],
      preview: mappedCategories.slice(0, 10),
    };
  },

  async exportCategories({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateExportScope({ scope, selectedIds });
    validateExportFormat(format);

    const categories = await this.getCategoriesForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!categories.length) {
      throw new AppError(
        CATEGORY_CODES.CATEGORY_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const mappedCategories = categories.map(mapCategory);

    const buffer = await exportCategories({
      categories: mappedCategories,
      format,
      user,
    });

    return {
      buffer,
      fileName: `categories_${Date.now()}.${
        format === "excel" ? "xlsx" : "pdf"
      }`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default CategoryService;
