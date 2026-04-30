import Discount from "../../models/payment/discount.model.js";
import Course from "../../models/courses/Course.js";
import User from "../../models/user/user.model.js";
import { DISCOUNT_CODES } from "../../constants/discount.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import AppError from "../../utils/AppError.js";
import { discountBulkItemSchema } from "../../validators/payment/discount.validator.js";
import {
  exportDiscountsFile,
  mapDiscountExportData,
} from "./discount.export.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";
export const mapDiscount = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  const populatedUsers =
    doc.allowedUsers?.length &&
    typeof doc.allowedUsers[0] === "object" &&
    doc.allowedUsers[0]._id;

  const populatedCreator =
    doc.createdBy && typeof doc.createdBy === "object" && doc.createdBy._id;

  return {
    id: doc._id?.toString(),

    code: doc.code,
    type: doc.type,
    value: doc.value,

    conditions: {
      minOrderValue: doc.minOrderValue,
      maxDiscountAmount: doc.maxDiscountAmount,
      applicableTo: doc.applicableTo,

      allowedUsers: populatedUsers
        ? doc.allowedUsers.map((u) => u._id.toString())
        : doc.allowedUsers?.map((id) => id?.toString()) || [],

      allowedUserNames: populatedUsers
        ? doc.allowedUsers.map((u) => u.fullname)
        : [],
    },

    validity: {
      startDate: doc.startDate,
      endDate: doc.endDate,
      isActive: doc.isActive,
    },

    usage: {
      usageLimit: doc.usageLimit,
      usedCount: doc.usedCount,
      remaining:
        doc.usageLimit > 0 ? Math.max(doc.usageLimit - doc.usedCount, 0) : null,
    },

    createdBy: populatedCreator
      ? {
          id: doc.createdBy._id.toString(),
          fullname: doc.createdBy.fullname,
        }
      : doc.createdBy?.toString() || null,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const validateDiscountExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      DISCOUNT_CODES.DISCOUNT_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      DISCOUNT_CODES.DISCOUNT_EXPORT_SELECTED_EMPTY,
      "Chưa chọn mã giảm giá để export",
      400
    );
  }
};

export const validateDiscountExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      DISCOUNT_CODES.DISCOUNT_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
async function buildDiscountFilter({ query, role, userId }) {
  const filter = {};

  const andConditions = [];

  // ===== ACTIVE =====
  if (query.isActive === "true") filter.isActive = true;

  if (query.isActive === "false") filter.isActive = false;

  // ===== TYPE =====
  if (query.type && query.type !== "all") {
    filter.type = query.type;
  }

  // ===== SEARCH =====
  if (query.search?.trim()) {
    andConditions.push({
      $or: [
        { code: { $regex: query.search.trim(), $options: "i" } },
        { type: { $regex: query.search.trim(), $options: "i" } },
      ],
    });
  }

  // ===== ROLE =====
  if (role === "instructor") {
    filter.createdBy = userId;

    andConditions.push({
      $or: [
        { applicableTo: "all" },
        { applicableTo: "course" },
        { applicableTo: "user_specific", allowedUsers: userId },
      ],
    });
  }

  if (andConditions.length) {
    filter.$and = andConditions;
  }

  return filter;
}
export function buildDiscountSort(sort) {
  switch (sort) {
    case "createdAt_asc":
      return { createdAt: 1, _id: 1 };

    case "createdAt_desc":
      return { createdAt: -1, _id: -1 };

    case "value_desc":
      return { value: -1, _id: -1 };

    case "value_asc":
      return { value: 1, _id: 1 };

    default:
      return { createdAt: -1, _id: -1 };
  }
}
const DiscountService = {
  async createDiscount(data, user) {
    try {
      const code = data.code?.trim()?.toUpperCase();

      if (!code) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_CREATE_FAILED,
          "Mã giảm giá không hợp lệ",
          400
        );
      }

      // ✅ duplicate check
      const existed = await Discount.findOne({ code });
      if (existed) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_EXISTS,
          "Mã giảm giá đã tồn tại",
          409
        );
      }

      const created = await Discount.create({
        ...data,
        code,
      });

      // ✅ audit log trong service
      await saveAuditLogs({
        entityType: "discounts",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: mapDiscount(created),
        updatedBy: user?.id || user?._id,
      });

      return mapDiscount(created);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateDiscount service error:", err);
      throw err;
    }
  },
  async bulkCreateDiscounts(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        DISCOUNT_CODES.DISCOUNT_BULK_INVALID_PAYLOAD,
        "Danh sách discount không hợp lệ"
      );
    }

    const validItems = [];
    const errors = [];

    // 1️⃣ Validate từng dòng
    inputList.forEach((item, index) => {
      const { error, value } = discountBulkItemSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          code: DISCOUNT_CODES.DISCOUNT_BULK_VALIDATION_FAILED,
          discountCode: item?.code || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // 2️⃣ Duplicate trong file theo code
    const seen = new Set();
    const uniqueValid = [];

    validItems.forEach((item) => {
      const key = item.code.toLowerCase();

      if (seen.has(key)) {
        errors.push({
          code: DISCOUNT_CODES.DISCOUNT_BULK_DUPLICATE_IN_FILE,
          discountCode: item.code,
          reason: ["Trùng code trong file import"],
        });
      } else {
        seen.add(key);
        uniqueValid.push(item);
      }
    });

    // 3️⃣ Map allowedUserNames → userId
    const allUserNames = [
      ...new Set(
        uniqueValid
          .flatMap((i) => i.allowedUserNames || [])
          .map((n) => n.toLowerCase())
      ),
    ];
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const users = await User.find({
      fullname: {
        $in: allUserNames.map((n) => new RegExp(`^${escapeRegex(n)}$`, "i")),
      },
    })
      .select("_id fullname")
      .lean();

    const userMap = new Map(
      users.map((u) => [u.fullname.toLowerCase(), u._id])
    );

    const mappedItems = [];

    // 4️⃣ Map FK + build create object
    uniqueValid.forEach((item, index) => {
      let allowedUserIds = [];

      if (item.allowedUserNames?.length > 0) {
        for (const name of item.allowedUserNames) {
          const userId = userMap.get(name.toLowerCase());

          if (!userId) {
            errors.push({
              index,
              code: DISCOUNT_CODES.DISCOUNT_USER_NOT_FOUND,
              discountCode: item.code,
              reason: [`User "${name}" không tồn tại`],
            });
            return;
          }

          allowedUserIds.push(userId);
        }
      }

      mappedItems.push({
        ...item,
        code: item.code.toUpperCase(),
        allowedUsers: allowedUserIds,
        createdBy: updatedBy,
        updatedBy,
      });
    });

    // 5️⃣ Check duplicate DB theo code
    const codes = mappedItems.map((i) => i.code);

    const existing = await Discount.find({
      code: { $in: codes },
    })
      .select("code")
      .lean();

    const existSet = new Set(existing.map((e) => e.code));

    const toCreate = [];
    const skipped = [];

    mappedItems.forEach((item) => {
      if (existSet.has(item.code)) {
        skipped.push({
          code: DISCOUNT_CODES.DISCOUNT_ALREADY_EXISTS,
          discountCode: item.code,
        });
      } else {
        toCreate.push(item);
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

    // 6️⃣ Insert
    const createdDocs = await Discount.insertMany(toCreate, {
      ordered: false,
    });

    // 7️⃣ Audit log
    await Promise.all(
      createdDocs.map((d) =>
        saveAuditLogs({
          entityType: "discounts",
          entityId: d._id,
          action: "create",
          oldData: {},
          newData: mapDiscount(d),
          updatedBy,
        })
      )
    );

    return {
      created: createdDocs.map(mapDiscount),
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
  async listDiscountsUseCase({ query, role, userId }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = await buildDiscountFilter({
      query,
      role,
      userId,
    });

    const sort = buildDiscountSort(query.sort);

    const [docs, total] = await Promise.all([
      Discount.find(filter).sort(sort).skip(skip).limit(limit).lean(),

      Discount.countDocuments(filter),
    ]);

    return {
      data: docs.map(mapDiscount),

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
  async updateDiscount(id, data, user) {
    try {
      if (!id) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_ID_REQUIRED,
          "Thiếu id mã giảm giá",
          400
        );
      }

      const oldDoc = await Discount.findById(id);
      if (!oldDoc) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_NOT_FOUND,
          "Không tìm thấy mã giảm giá",
          404
        );
      }

      const oldMapped = mapDiscount(oldDoc);

      const updateData = { ...data };

      if (updateData.code) {
        updateData.code = updateData.code.trim().toUpperCase();
      }

      updateData.updatedBy = user.id || user._id;

      const updatedDoc = await Discount.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      const mapped = mapDiscount(updatedDoc);

      await saveAuditLogs({
        entityType: "discounts",
        entityId: id,
        action: "update",
        oldData: oldMapped,
        newData: mapped,
        updatedBy: getUserIdentifier(user),
      });

      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      throw new AppError(
        DISCOUNT_CODES.DISCOUNT_UPDATE_FAILED,
        "Không thể cập nhật mã giảm giá",
        500
      );
    }
  },
  async removeManyDiscounts(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        DISCOUNT_CODES.DISCOUNT_DELETE_EMPTY_IDS,
        "Không có mã giảm giá để xóa",
        400
      );
    }

    // Lấy danh sách cần xóa
    const discounts = await Discount.find({ _id: { $in: ids } });

    if (discounts.length !== ids.length) {
      const foundIds = discounts.map((d) => d._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        DISCOUNT_CODES.DISCOUNT_NOT_FOUND,
        `Không tìm thấy mã: ${notFoundIds.join(", ")}`,
        404
      );
    }

    const mappedOld = discounts.map(mapDiscount);

    // Xóa
    await Discount.deleteMany({ _id: { $in: ids } });

    // Audit log
    await Promise.all(
      discounts.map((discount, index) =>
        saveAuditLogs({
          entityType: "discounts",
          entityId: discount._id,
          action: "delete",
          oldData: mappedOld[index],
          newData: {},
          updatedBy: actor?.id || actor?._id,
        })
      )
    );

    return {
      deletedIds: ids,
      deletedCount: ids.length,
    };
  },
  async getFeaturedDiscount() {
    const now = new Date();

    const discount = await Discount.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: 0 },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
      ],
    })
      .sort({
        value: -1,
        createdAt: -1,
      })
      .lean();

    if (!discount) return null;

    return mapDiscount(discount);
  },

  async getDiscountsForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.code = { $regex: filters.search, $options: "i" };
    }

    if (Array.isArray(filters?.status) && filters.status.length > 0) {
      query.isActive = filters.status.includes("active");
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Discount.find(query)
      .populate("allowedUsers", "fullname email")
      .populate("createdBy", "fullname")
      .sort({ createdAt: -1 })
      .lean();
  },
  async previewExportDiscounts({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateDiscountExportScope({ scope, selectedIds });

    const discounts = await this.getDiscountsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!discounts.length) {
      throw new AppError(
        DISCOUNT_CODES.DISCOUNT_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = mapDiscountExportData(discounts);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },
  async exportDiscounts({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateDiscountExportScope({ scope, selectedIds });
    validateDiscountExportFormat(format);

    const discounts = await this.getDiscountsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!discounts.length) {
      throw new AppError(
        DISCOUNT_CODES.DISCOUNT_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportDiscountsFile({
      discounts,
      format,
    });

    await saveAuditLogs({
      entityType: "discounts",
      action: "export",
      entityId: null,
      oldData: {},
      newData: { count: discounts.length, format },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `discounts_${Date.now()}.${
        format === "excel" ? "xlsx" : "pdf"
      }`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
  async applyDiscount({ code, items }, user) {
    try {
      // ==============================
      // 1️⃣ Validate Input
      // ==============================
      if (!code || !items?.length) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_INVALID_INPUT,
          "Thiếu mã giảm giá hoặc danh sách sản phẩm",
          400
        );
      }

      const productIds = items.map((i) => i.productId);

      // ==============================
      // 2️⃣ Load Courses From DB
      // ==============================
      const courses = await Course.find({
        _id: { $in: productIds },
        status: "published",
      }).select("_id price discountPrice");

      if (courses.length !== productIds.length) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_INVALID_PRODUCTS,
          "Sản phẩm không hợp lệ",
          400
        );
      }

      // ==============================
      // 3️⃣ Tính Subtotal Server-side
      // ==============================
      const orderTotal = courses.reduce(
        (sum, c) => sum + (c.discountPrice || c.price),
        0
      );

      // ==============================
      // 4️⃣ Load Discount
      // ==============================
      const discount = await Discount.findOne({
        code: code.toUpperCase(),
      });

      if (!discount) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_NOT_FOUND,
          "Mã giảm giá không tồn tại",
          404
        );
      }

      const now = new Date();

      if (!discount.isActive) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_INACTIVE,
          "Mã đã bị vô hiệu hóa",
          400
        );
      }

      if (discount.startDate && now < discount.startDate) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_NOT_STARTED,
          "Mã chưa đến ngày bắt đầu",
          400
        );
      }

      if (discount.endDate && now > discount.endDate) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_EXPIRED,
          "Mã đã hết hạn",
          400
        );
      }

      if (
        discount.usageLimit > 0 &&
        discount.usedCount >= discount.usageLimit
      ) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_USAGE_LIMIT_REACHED,
          "Mã đã hết lượt sử dụng",
          400
        );
      }

      // ==============================
      // 5️⃣ Check applicableTo
      // ==============================
      if (discount.applicableTo === "user_specific") {
        const isAllowed = discount.allowedUsers.some(
          (u) => u.toString() === user._id.toString()
        );

        if (!isAllowed) {
          throw new AppError(
            DISCOUNT_CODES.DISCOUNT_NOT_ALLOWED_FOR_USER,
            "Mã không áp dụng cho người dùng này",
            403
          );
        }
      }

      // ==============================
      // 6️⃣ Check min order value
      // ==============================
      if (orderTotal < discount.minOrderValue) {
        throw new AppError(
          DISCOUNT_CODES.DISCOUNT_MIN_ORDER_NOT_MET,
          `Đơn hàng phải >= ${discount.minOrderValue}`,
          400
        );
      }

      // ==============================
      // 7️⃣ Tính Discount Amount
      // ==============================
      let discountAmount = 0;

      if (discount.type === "percentage") {
        discountAmount = (orderTotal * discount.value) / 100;
      } else {
        discountAmount = discount.value;
      }

      if (
        discount.maxDiscountAmount > 0 &&
        discountAmount > discount.maxDiscountAmount
      ) {
        discountAmount = discount.maxDiscountAmount;
      }

      const finalTotal = Math.max(0, orderTotal - discountAmount);

      // ==============================
      // 8️⃣ Audit Log
      // ==============================
      await saveAuditLogs({
        entityType: "discounts",
        entityId: discount._id,
        action: "apply",
        oldData: {},
        newData: {
          orderTotal,
          discountAmount,
          finalTotal,
        },
        updatedBy: user._id,
      });

      // ==============================
      // 9️⃣ Return
      // ==============================
      return {
        discount: mapDiscount(discount),
        orderTotal,
        discountAmount,
        finalTotal,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("Apply discount service error:", err);
      throw new AppError(
        DISCOUNT_CODES.DISCOUNT_APPLY_FAILED,
        "Áp dụng mã giảm giá thất bại",
        500
      );
    }
  },
};

export default DiscountService;
