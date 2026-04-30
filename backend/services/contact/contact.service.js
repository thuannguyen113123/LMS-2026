import ContactMessage from "../../models/contact/contact.model.js";
import User from "../../models/user/user.model.js";
import Role from "../../models/role/role.model.js";
import NotificationService, {
  TYPE_SETTING_MAP,
} from "../notification/notification.service.js";
import AppError from "../../utils/AppError.js";
import { saveAuditLogs } from "../auditLog/auditLog.service.js";
export const mapContact = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    subject: doc.subject,
    message: doc.message,

    status: doc.status,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export function buildContactFilter({ query }) {
  const filter = {};

  // ===== STATUS FILTER =====
  if (query.status && query.status !== "all") {
    const statuses = Array.isArray(query.status)
      ? query.status
      : [query.status];

    filter.status = { $in: statuses };
  }

  // ===== SEARCH =====
  if (query.search?.trim()) {
    const keyword = query.search.trim();

    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { subject: { $regex: keyword, $options: "i" } },
      { message: { $regex: keyword, $options: "i" } },
    ];
  }

  // ===== DATE RANGE =====
  if (query.from || query.to) {
    filter.createdAt = {};

    if (query.from) {
      filter.createdAt.$gte = new Date(query.from);
    }

    if (query.to) {
      filter.createdAt.$lte = new Date(query.to);
    }
  }

  return filter;
}
export function buildContactSort({ sort }) {
  switch (sort) {
    case "oldest":
      return { createdAt: 1, _id: 1 };

    case "status":
      return { status: 1, _id: -1 };

    case "latest":
    default:
      return { createdAt: -1, _id: -1 };
  }
}

const ContactService = {
  async createMessage(payload) {
    const { name, email, phone, subject, message } = payload;

    // 1. Validate
    if (!name || !email || !message) {
      throw new AppError(
        "INVALID_CONTACT_PAYLOAD",
        "Thiếu thông tin bắt buộc",
        400
      );
    }

    // 2. Save contact
    const contact = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    // 3. Get admin role
    const adminRole = await Role.findOne({ name: "admin" }).select("_id");

    if (!adminRole) {
      throw new AppError("ROLE_NOT_FOUND", "Không tìm thấy role admin", 500);
    }

    // 4. Find admin users
    const admins = await User.find({
      active_role_id: adminRole._id,
    })
      .select("_id")
      .lean();

    //  5. Send notifications (nếu có admin)
    if (admins.length > 0) {
      await Promise.all(
        admins.map((admin) =>
          NotificationService.send({
            userId: admin._id,
            type: TYPE_SETTING_MAP.CONTACT_MESSAGE,
            title: "Liên hệ mới từ website",
            message: `${name} đã gửi liên hệ mới`,

            entityId: contact.id,
            entityType: "Contact",

            meta: {
              email,
              subject,
            },
          })
        )
      );
    }

    return contact;
  },
  async listAdminContactsUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = buildContactFilter({ query });

    const sort = buildContactSort({
      sort: query.sort,
    });

    const [contacts, total] = await Promise.all([
      ContactMessage.find(filter).sort(sort).skip(skip).limit(limit).lean(),

      ContactMessage.countDocuments(filter),
    ]);

    return {
      data: contacts.map(mapContact),

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
  async updateStatusUseCase({ id, status }) {
    const allowed = ["new", "read", "replied"];

    if (!allowed.includes(status)) {
      throw new AppError("INVALID_STATUS", "Trạng thái không hợp lệ", 400);
    }

    const contact = await ContactMessage.findByIdAndUpdate(
      id,
      {
        status,
      },
      { new: true }
    ).lean();

    if (!contact) {
      throw new AppError("CONTACT_NOT_FOUND", "Không tìm thấy liên hệ", 404);
    }

    return mapContact(contact);
  },
  async removeManyContactsUseCase(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        "CONTACT_DELETE_EMPTY_IDS",
        "Không có liên hệ để xóa",
        400
      );
    }

    const contacts = await ContactMessage.find({
      _id: { $in: ids },
    });

    if (contacts.length !== ids.length) {
      const foundIds = contacts.map((c) => c._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        "CONTACT_NOT_FOUND",
        `Không tìm thấy liên hệ: ${notFoundIds.join(", ")}`,
        404
      );
    }

    const mappedOld = contacts.map(mapContact);

    await ContactMessage.deleteMany({
      _id: { $in: ids },
    });

    await Promise.all(
      contacts.map((contact, index) =>
        saveAuditLogs({
          entityType: "contacts",
          entityId: contact._id,
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
};

export default ContactService;
