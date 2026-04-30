import InstructorRequest from "../../models/instructorRequest/instructorRequest.model.js";
import NotificationService, {
  TYPE_SETTING_MAP,
} from "../../services/notification/notification.service.js";
import InstructorService from "../../services/instructor/instructor.service.js";
import Notification from "../../models/notification/notification.model.js";
import User from "../../models/user/user.model.js";
import Role from "../../models/role/role.model.js";
import AppError from "../../utils/AppError.js";

const InstructorRequestService = {
  async requestUpgrade(user) {
    const userId = user.id || user._id;

    const instructorRole = await Role.findOne({ name: "instructor" });

    const userDoc = await User.findById(userId);

    const isInstructor = userDoc.role_ids.some(
      (r) => r.toString() === instructorRole._id.toString()
    );

    if (isInstructor) {
      throw new AppError("ALREADY_INSTRUCTOR", "Bạn đã là giảng viên", 400);
    }

    const existed = await InstructorRequest.findOne({
      user: userId,
      status: "pending",
    });

    if (existed) {
      throw new AppError("REQUEST_EXISTS", "Bạn đã gửi yêu cầu rồi", 400);
    }

    const request = await InstructorRequest.create({
      user: userId,
      message: "",
      meta: {
        ip: user?.ip || null,
        userAgent: user?.userAgent || null,
        source: "web",
      },
    });

    // 🔔 gửi cho admin
    const admins = await User.find({}).populate("role_ids");

    const adminIds = admins
      .filter((u) => u.role_ids.some((r) => r.name === "admin"))
      .map((u) => u._id);

    await Promise.all(
      adminIds.map((adminId) =>
        NotificationService.send({
          userId: adminId,
          type: TYPE_SETTING_MAP.INSTRUCTOR_UPGRADE_REQUEST,
          title: "Yêu cầu trở thành giảng viên",
          message: `${userDoc.fullname} đã gửi yêu cầu trở thành giảng viên`,

          entityId: request._id,
          entityType: "InstructorRequest",

          meta: {
            requesterId: userId,
            status: "pending",
          },
        })
      )
    );

    return request;
  },
  async approveRequest(requestId, admin) {
    const request = await InstructorRequest.findById(requestId);

    if (!request) {
      throw new AppError("REQUEST_NOT_FOUND", "Không tìm thấy request", 404);
    }

    if (request.status !== "pending") {
      throw new AppError("REQUEST_PROCESSED", "Request đã xử lý", 400);
    }

    // ✅ tạo instructor + add role (reuse code mày)
    const instructor = await InstructorService.createInstructor(
      {
        user: request.user,
      },
      admin
    );

    request.status = "approved";
    request.review = {
      by: admin.id,
      at: new Date(),
      reason: "",
    };

    await request.save();
    await Notification.updateMany(
      {
        entityId: requestId,
        entityType: "InstructorRequest",
      },
      {
        read: true,
        "meta.status": "approved",
      }
    );

    // 🔔 notify lại user
    await NotificationService.send({
      userId: request.user,
      type: TYPE_SETTING_MAP.INSTRUCTOR_APPROVED,
      title: "Đã được duyệt",
      message: "Bạn đã trở thành giảng viên ",

      entityId: request.id,
      entityType: "InstructorRequest",
    });

    return instructor;
  },
  async rejectRequest(requestId, admin, reason) {
    const request = await InstructorRequest.findById(requestId);

    if (!request) {
      throw new AppError("REQUEST_NOT_FOUND", "Không tìm thấy request", 404);
    }

    if (request.status !== "pending") {
      throw new AppError("REQUEST_PROCESSED", "Request đã xử lý", 400);
    }

    request.status = "rejected";
    request.reviewedBy = admin.id;
    request.reviewedAt = new Date();
    request.review = {
      by: admin.id,
      at: new Date(),
      reason: reason || "",
    };

    await request.save();

    await Notification.updateMany(
      {
        entityId: requestId,
        entityType: "InstructorRequest",
      },
      {
        read: true,
        "meta.status": "rejected",
      }
    );

    await NotificationService.send({
      userId: request.user,
      type: TYPE_SETTING_MAP.INSTRUCTOR_REJECTED,
      title: "Yêu cầu bị từ chối",
      message: reason || "Yêu cầu của bạn đã bị từ chối",

      entityId: request.id,
      entityType: "InstructorRequest",
    });

    return true;
  },
};
export default InstructorRequestService;
