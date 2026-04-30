import Order from "../../models/payment/order.model.js";
import Course from "../../models/courses/Course.js";
import Student from "../../models/student/student.model.js";
import Discount from "../../models/payment/discount.model.js";
import mongoose from "mongoose";

import { ORDER_CODES } from "../../constants/order.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import AppError from "../../utils/AppError.js";
import User from "../../models/user/user.model.js";
import { orderItemBulkSchema } from "../../validators/payment/order.validator.js";
import {
  exportOrdersFile,
  mapOrderExportData,
  ORDER_EXPORT_COLUMNS,
} from "./orderExport.js";

export const mapOrder = (doc) => {
  if (!doc) return null;

  const d = doc.toObject ? doc.toObject() : doc;

  const getId = (v) => {
    if (!v) return null;
    if (typeof v === "string") return v;
    return v._id?.toString?.() || v.toString?.();
  };

  return {
    id: getId(d),

    user: d.userId
      ? {
          id: getId(d.userId),
          fullname: d.userId.fullname,
          email: d.userId.email,
          phone: d.userId.phone,
        }
      : null,

    items: (d.items || []).map((item) => ({
      itemType: item.itemType,
      itemId: getId(item.itemId),
      title: item.title,
      price: item.price,
    })),

    itemsCount: d.items?.length ?? 0,

    subtotal: d.subtotal,
    discountApplied: d.discountApplied,
    couponCode: d.couponCode,
    discountValue: d.discountValue,

    totalAmount: d.totalAmount,
    finalAmount: d.finalAmount,

    payment: d.paymentId
      ? {
          id: getId(d.paymentId),
          method: d.paymentId.method,
          transactionId: d.paymentId.transactionId,
          status: d.paymentId.status,
        }
      : null,

    status: d.status,

    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
};

export async function buildOrderFilter({ query, role, userId }) {
  const filter = {};

  // ===== ROLE FILTER =====

  if (role === "student") {
    filter.userId = new mongoose.Types.ObjectId(userId);
  } else if (role === "instructor") {
    const instructorDoc = await Instructor.findOne({ user: userId }).lean();

    if (!instructorDoc) {
      filter._id = null;
      return filter;
    }

    // 🔥 đơn chứa khóa học của instructor
    filter["items.itemType"] = "course";
    filter["items.itemRef"] = instructorDoc._id;
  }

  // admin → không filter gì thêm

  // ===== STATUS =====
  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  // ===== SEARCH =====
  if (query.search?.trim()) {
    filter.$or = [
      { "items.title": { $regex: query.search, $options: "i" } },
      { couponCode: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
}
export function applyOrderTypeFilter(filter, type) {
  switch (type) {
    case "pending":
      filter.status = "pending";
      break;

    case "paid":
      filter.status = "paid";
      break;

    case "recent":
      filter.createdAt = {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
      break;

    case "high_value":
      filter.finalAmount = { $gte: 1000000 };
      break;
  }

  return filter;
}
export function buildOrderSort({ sort, type }) {
  if (type === "recent") return { createdAt: -1, _id: -1 };

  switch (sort) {
    case "amount_desc":
      return { finalAmount: -1, _id: -1 };

    case "amount_asc":
      return { finalAmount: 1, _id: 1 };

    case "oldest":
      return { createdAt: 1, _id: 1 };

    default:
      return { createdAt: -1, _id: -1 };
  }
}
function buildCursorFilter(cursor) {
  if (!cursor) return {};

  return {
    _id: { $lt: new mongoose.Types.ObjectId(cursor) },
  };
}
export const validateOrderExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      ORDER_CODES.ORDER_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      ORDER_CODES.ORDER_EXPORT_SELECTED_EMPTY,
      "Chưa chọn đơn hàng để export",
      400
    );
  }
};

export const validateOrderExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      ORDER_CODES.ORDER_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
export const mapStudentOrderCard = (order) => {
  const firstItem = order.items?.[0];

  return {
    id: order._id.toString(),

    status: order.status,
    createdAt: order.createdAt,

    summary: {
      title:
        order.items.length > 1
          ? `${firstItem.title} +${order.items.length - 1}`
          : firstItem.title,

      itemsCount: order.items.length,
    },

    pricing: {
      subtotal: order.subtotal,
      discount: order.discount?.discountAmount || 0,
      finalAmount: order.finalAmount,
      formattedPrice: order.finalAmount.toLocaleString("vi-VN") + "₫",
    },

    payment: {
      status: order.paymentId?.status || "pending",
    },
  };
};

const orderService = {
  async createOrder(data, user) {
    try {
      const { items, couponCode } = data;
      const userId = user?.id || user?._id;

      if (!items?.length) {
        throw new AppError(
          ORDER_CODES.ORDER_ITEMS_EMPTY,
          "Danh sách sản phẩm không hợp lệ",
          400
        );
      }

      // ==========================================
      // 1️⃣ Remove duplicate productId
      // ==========================================
      const rawProductIds = items.map((i) => String(i.productId));
      const uniqueProductIds = [...new Set(rawProductIds)];

      if (uniqueProductIds.length !== rawProductIds.length) {
        throw new AppError(
          ORDER_CODES.ORDER_INVALID_PAYLOAD,
          "Danh sách sản phẩm bị trùng",
          400
        );
      }

      // ==========================================
      // 2️⃣ Check user đã enrolled chưa (FIXED)
      // ==========================================
      const student = await Student.findOne({ user: userId }).lean();

      if (!student) {
        throw new AppError(
          ORDER_CODES.ORDER_INVALID_PAYLOAD,
          "Student không tồn tại",
          400
        );
      }

      const enrolledCourseIds = student.enrolledCourses.map((e) =>
        e.course.toString()
      );

      const hasOwnedCourse = uniqueProductIds.some((id) =>
        enrolledCourseIds.includes(id)
      );

      if (hasOwnedCourse) {
        throw new AppError(
          ORDER_CODES.ORDER_ALREADY_ENROLLED,
          "Bạn đã sở hữu một hoặc nhiều khóa học trong đơn hàng",
          400
        );
      }

      // ==========================================
      // 3️⃣ Load courses từ DB
      // ==========================================
      const courses = await Course.find({
        _id: { $in: uniqueProductIds },
        status: "published",
      });

      if (courses.length !== uniqueProductIds.length) {
        throw new AppError(
          ORDER_CODES.ORDER_INVALID_PAYLOAD,
          "Sản phẩm không tồn tại hoặc đã bị ẩn",
          400
        );
      }

      // ==========================================
      // 4️⃣ Snapshot item data
      // ==========================================
      const mappedItems = courses.map((course) => {
        const price =
          course.discountPrice &&
          Number(course.discountPrice) > 0 &&
          Number(course.discountPrice) < Number(course.price)
            ? Number(course.discountPrice)
            : Number(course.price);

        return {
          itemType: "course",
          itemId: course._id,
          title: course.title,
          price,
        };
      });

      // ==========================================
      // 5️⃣ Tính subtotal server-side
      // ==========================================
      const subtotal = mappedItems.reduce(
        (sum, item) => sum + Number(item.price),
        0
      );

      if (subtotal <= 0) {
        throw new AppError(
          ORDER_CODES.ORDER_INVALID_PAYLOAD,
          "Tổng tiền đơn hàng không hợp lệ",
          400
        );
      }

      let discountSnapshot = null;

      // ==========================================
      // 6️⃣ Apply coupon nếu có
      // ==========================================
      if (couponCode) {
        const normalizedCode = couponCode.trim().toUpperCase();

        const discount = await Discount.findOne({
          code: normalizedCode,
          isActive: true,
        });

        if (!discount) {
          throw new AppError(
            ORDER_CODES.INVALID_COUPON,
            "Mã giảm giá không hợp lệ",
            400
          );
        }

        const now = new Date();

        if (
          (discount.startDate && now < discount.startDate) ||
          (discount.endDate && now > discount.endDate)
        ) {
          throw new AppError(
            ORDER_CODES.INVALID_COUPON,
            "Mã giảm giá đã hết hạn hoặc chưa bắt đầu",
            400
          );
        }

        if (
          discount.usageLimit > 0 &&
          discount.usedCount >= discount.usageLimit
        ) {
          throw new AppError(
            ORDER_CODES.INVALID_COUPON,
            "Mã giảm giá đã hết lượt sử dụng",
            400
          );
        }

        if (subtotal < discount.minOrderValue) {
          throw new AppError(
            ORDER_CODES.INVALID_COUPON,
            "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã",
            400
          );
        }

        if (discount.type === "percentage" && Number(discount.value) > 100) {
          throw new AppError(
            ORDER_CODES.INVALID_COUPON,
            "Phần trăm giảm giá không hợp lệ",
            400
          );
        }

        let discountAmount =
          discount.type === "percentage"
            ? (subtotal * discount.value) / 100
            : Number(discount.value);

        if (
          discount.maxDiscountAmount > 0 &&
          discountAmount > discount.maxDiscountAmount
        ) {
          discountAmount = discount.maxDiscountAmount;
        }

        discountSnapshot = {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          discountAmount,
        };
      }

      // ==========================================
      // 7️⃣ Final amount
      // ==========================================
      const finalAmount = Math.max(
        subtotal - (discountSnapshot?.discountAmount || 0),
        0
      );

      // ==========================================
      // 8️⃣ Create Order
      // ==========================================
      const created = await Order.create({
        userId,
        items: mappedItems,
        subtotal,
        discount: discountSnapshot
          ? {
              code: discountSnapshot.code,
              discountType: discountSnapshot.type, // rename
              value: discountSnapshot.value,
              discountAmount: discountSnapshot.discountAmount,
            }
          : undefined,
        totalAmount: subtotal, // ADD THIS
        finalAmount, // already correct
        status: "pending",
      });

      // ==========================================
      // 9️⃣ Audit log
      // ==========================================
      await saveAuditLogs({
        entityType: "orders",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: {
          userId: created.userId,
          finalAmount: created.finalAmount,
          status: created.status,
        },
        updatedBy: userId,
      });

      return mapOrder(created);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateOrder service error:", err);

      throw new AppError(
        ORDER_CODES.ORDER_CREATE_FAILED,
        "Tạo đơn hàng thất bại",
        500
      );
    }
  },
  async bulkCreateOrders(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        ORDER_CODES.ORDER_BULK_INVALID_PAYLOAD,
        "Danh sách order không hợp lệ"
      );
    }

    const validItems = [];
    const errors = [];

    // 1️⃣ validate từng dòng
    inputList.forEach((item, index) => {
      const { error, value } = orderItemBulkSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          code: ORDER_CODES.ORDER_BULK_VALIDATION_FAILED,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // 2️⃣ map userName → userId
    const userNames = [
      ...new Set(validItems.map((i) => i.userName.toLowerCase())),
    ];

    const users = await User.find({
      fullname: {
        $in: userNames.map((n) => new RegExp(`^${n}$`, "i")),
      },
    })
      .select("_id fullname")
      .lean();

    const userMap = new Map(
      users.map((u) => [u.fullname.toLowerCase(), u._id])
    );

    const mappedOrders = [];

    // 3️⃣ map FK
    validItems.forEach((item, index) => {
      const userId = userMap.get(item.userName.toLowerCase());

      if (!userId) {
        errors.push({
          index,
          code: ORDER_CODES.ORDER_USER_NOT_FOUND,
          reason: [`User "${item.userName}" không tồn tại`],
        });
        return;
      }

      const mappedItems = item.items.map((i) => ({
        itemType: i.itemType || "course",
        title: i.productTitle,
        price: i.price,
      }));

      mappedOrders.push({
        userId,
        items: mappedItems,
        subtotal: item.subtotal,
        discountApplied: item.discountApplied,
        couponCode: item.couponCode,
        discountValue: item.discountValue,
        totalAmount: item.totalAmount,
        finalAmount: item.finalAmount,
        status: "pending",
        createdBy: updatedBy,
        updatedBy,
      });
    });

    if (mappedOrders.length === 0) {
      return {
        created: [],
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          failed: errors.length,
        },
      };
    }

    // 4️⃣ insertMany
    const createdDocs = await Order.insertMany(mappedOrders, {
      ordered: false,
    });

    // 5️⃣ audit log
    await Promise.all(
      createdDocs.map((order) =>
        saveAuditLogs({
          entityType: "orders",
          entityId: order._id,
          action: "create",
          oldData: {},
          newData: mapOrder(order),
          updatedBy,
        })
      )
    );

    return {
      created: createdDocs.map(mapOrder),
      errors,
      summary: {
        total: inputList.length,
        created: createdDocs.length,
        failed: errors.length,
      },
    };
  },
  async listOrdersUseCase(input) {
    const { query } = input;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    const type = query.type || null;

    let filter = await buildOrderFilter(input);

    filter = await applyOrderTypeFilter(filter, type);

    const sortOptions = buildOrderSort({
      sort: query.sort,
      type,
    });

    const [docs, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "fullname email phone")
        .populate("paymentId", "method transactionId status")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter),
    ]);

    const data = docs.map(mapOrder);

    return {
      data,

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
  async listMyOrdersForStudent({ userId, query }) {
    const limit = Math.min(Number(query.limit) || 8, 20);

    const filter = {
      userId: new mongoose.Types.ObjectId(userId),
      ...buildCursorFilter(query.cursor),
    };

    // UX filters
    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }

    const orders = await Order.find(filter)
      .populate("paymentId", "method status")
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = orders.length > limit;
    if (hasNext) orders.pop();

    const mapped = orders.map(mapStudentOrderCard);

    return {
      data: mapped,
      pagination: {
        nextCursor: hasNext ? orders[orders.length - 1]._id : null,
        hasNext,
      },
    };
  },
  async updateOrderUseCase({ id, payload, actor }) {
    const { status, paymentId } = payload;

    const validStatuses = ["pending", "paid", "cancelled"];

    if (status && !validStatuses.includes(status)) {
      throw new AppError(
        ORDER_CODES.ORDER_INVALID_PAYLOAD,
        "Trạng thái đơn hàng không hợp lệ",
        400
      );
    }

    // ===== find =====
    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(
        ORDER_CODES.ORDER_NOT_FOUND,
        "Không tìm thấy đơn hàng",
        404
      );
    }

    // ===== snapshot OLD =====
    const oldData = mapOrder(order);

    // ===== update fields =====
    if (status) order.status = status;
    if (paymentId !== undefined) {
      order.paymentId = paymentId || null;
    }

    await order.save();

    // ===== reload populated =====
    const updated = await Order.findById(order._id)
      .populate("userId", "fullname email phone")
      .populate("paymentId", "method transactionId status")
      .lean();

    const mapped = mapOrder(updated);

    // ===== audit =====
    await saveAuditLogs({
      entityType: "orders",
      entityId: order._id,
      action: "update",
      oldData,
      newData: mapped,
      updatedBy: actor?.id || actor?._id,
    });

    return mapped;
  },

  async removeManyOrders(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        ORDER_CODES.ORDER_DELETE_EMPTY_IDS,
        "Không có đơn hàng để xóa",
        400
      );
    }

    // lấy data cũ
    const orders = await Order.find({
      _id: { $in: ids },
    });

    if (orders.length !== ids.length) {
      const foundIds = orders.map((o) => o._id.toString());

      const notFoundIds = ids.filter((id) => !foundIds.includes(id.toString()));

      throw new AppError(
        ORDER_CODES.ORDER_NOT_FOUND,
        `Không tìm thấy đơn hàng: ${notFoundIds.join(", ")}`,
        404
      );
    }

    const mappedOld = orders.map(mapOrder); // nếu có mapper

    // delete
    await Order.deleteMany({
      _id: { $in: ids },
    });

    // audit log
    await Promise.all(
      orders.map((order, index) =>
        saveAuditLogs({
          entityType: "orders",
          entityId: order._id,
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

  async getOrdersForExport({ scope, selectedIds = [], filters = {} }) {
    const query = {};

    if (filters?.status && filters.status !== "all") {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }

    if (filters?.search) {
      query.$or = [
        { "items.title": { $regex: filters.search, $options: "i" } },
      ];
    }

    if (scope === "SELECTED") {
      query._id = {
        $in: selectedIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    return Order.find(query)
      .populate("userId", "fullname email")
      .sort({ createdAt: -1 })
      .lean();
  },
  async previewExportOrders({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateOrderExportScope({
      scope,
      selectedIds,
    });

    const orders = await this.getOrdersForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!orders.length) {
      throw new AppError(
        ORDER_CODES.ORDER_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mappedOrders = orders.map(mapOrder);

    const mapped = mapOrderExportData(mappedOrders);

    return {
      total: mapped.length,

      columns: ORDER_EXPORT_COLUMNS.map((c) => c.key),

      preview: mapped.slice(0, 10),
    };
  },
  async exportOrders({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateOrderExportScope({
      scope,
      selectedIds,
    });

    validateOrderExportFormat(format);

    const orders = await this.getOrdersForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!orders.length) {
      throw new AppError(
        ORDER_CODES.ORDER_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const mappedOrders = orders.map(mapOrder);

    const buffer = await exportOrdersFile({
      orders: mappedOrders,
      format,
    });

    await saveAuditLogs({
      entityType: "orders",

      action: "export",

      entityId: null,

      oldData: {},

      newData: {
        count: orders.length,
        format,
      },

      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,

      fileName: `orders_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,

      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};
export default orderService;
