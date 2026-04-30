import Student from "../../models/student/student.model.js";
import Course from "../../models/courses/Course.js";
import Instructor from "../../models/instructor/instructor.model.js";
import User from "../../models/user/user.model.js";

import AppError from "../../utils/AppError.js";
import { generateCertificateNumber } from "../certificate/certificateNumber.service.js";
import { saveAuditLogs } from "../auditLog/auditLog.service.js";
import { getIO } from "../../sockets/socket.js";

export const mapCertificate = (doc) => {
  if (!doc) return null;

  const course = doc.course;

  return {
    id: doc._id.toString(),

    certificateNumber: doc.certificateNumber,
    certificateUrl: doc.certificateUrl,
    status: doc.status,
    issuedAt: doc.issuedAt,

    course: course
      ? {
          id: course._id.toString(),
          title: course.title,
          slug: course.slug,
          coverImage: course.coverImage,
        }
      : null,
  };
};
export function mapCertificateForStudent(
  cert,
  course,
  studentUser,
  instructorUser
) {
  return {
    id: cert._id,

    certificateNumber: cert.certificateNumber,
    status: cert.status,
    issuedAt: cert.issuedAt,
    certificateUrl: cert.certificateUrl,

    course: {
      title: course.title,
      category: course.category?.name || "",
    },

    student: {
      fullname: studentUser.fullname,
    },

    instructor: {
      fullname: instructorUser?.fullname || "LMS Academy",
    },
  };
}
export function buildCertificateFilter({ query }) {
  const filter = {};

  if (query.status && query.status !== "All") {
    filter["certificates.status"] = query.status;
  }

  if (query.course) {
    filter["certificates.course"] = new mongoose.Types.ObjectId(query.course);
  }

  if (query.fromDate || query.toDate) {
    filter["certificates.issuedAt"] = {};

    if (query.fromDate) {
      filter["certificates.issuedAt"].$gte = new Date(query.fromDate);
    }

    if (query.toDate) {
      filter["certificates.issuedAt"].$lte = new Date(query.toDate);
    }
  }
  if (query.search?.trim()) {
    filter["certificates.certificateNumber"] = {
      $regex: query.search.trim(),
      $options: "i",
    };
  }

  return filter;
}
export function buildCertificateSort({ sort }) {
  switch (sort) {
    case "oldest":
      return { "certificates.issuedAt": 1 };

    case "latest":
    default:
      return { "certificates.issuedAt": -1 };
  }
}

const StudentCertificateService = {
  async issueCertificate({ studentId, courseId, instructorId }) {
    /* ================= FIND STUDENT ================= */
    const student = await Student.findById(studentId);

    if (!student) {
      throw new AppError(
        STUDENT_CODES.CERTIFICATE_STUDENT_NOT_FOUND,
        "Student not found",
        404
      );
    }

    /* ================= CHECK EXIST ================= */
    const existed = student.certificates.find(
      (c) => c.course.toString() === courseId.toString()
    );

    if (existed) {
      throw new AppError(
        STUDENT_CODES.CERTIFICATE_ALREADY_EXISTS,
        "Certificate already issued",
        409
      );
    }

    /* ================= CREATE CERT ================= */
    const certificateNumber = await generateCertificateNumber();

    const certificate = {
      course: courseId,
      certificateNumber,
      status: "issued",
      issuedAt: new Date(),
      issuedBy: instructorId,
    };

    student.certificates.push(certificate);
    await student.save();

    /* ================= GET SAVED CERT ================= */
    const savedCert = student.certificates.find(
      (c) => c.certificateNumber === certificateNumber
    );

    if (!savedCert) {
      throw new AppError(
        "CERTIFICATE_CREATE_FAILED",
        "Failed to create certificate",
        500
      );
    }

    /* ================= POPULATE DATA ================= */
    const course = await Course.findById(courseId)
      .populate("category", "name")
      .lean();

    const studentUser = await User.findById(student.user)
      .select("fullname")
      .lean();

    const instructor = await Instructor.findById(instructorId)
      .populate("user", "fullname")
      .lean();

    /* ================= MAP DTO ================= */
    const mapped = mapCertificateForStudent(
      savedCert,
      course,
      studentUser,
      instructor?.user
    );

    /* ================= REALTIME EMIT ================= */
    try {
      const io = getIO();

      io.to("user:" + student.user.toString()).emit(
        "certificate:issued",
        mapped
      );
    } catch (err) {
      // socket fail không được làm fail business logic
      console.error("⚠️ Socket emit failed:", err.message);
    }

    /* ================= RETURN ================= */
    return mapped;
  },
  async listAdminCertificatesUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const match = buildCertificateFilter({ query });
    const sort = buildCertificateSort({ sort: query.sort });

    const pipeline = [
      { $unwind: "$certificates" },

      { $match: match },

      {
        $lookup: {
          from: "courses",
          localField: "certificates.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "studentUser",
        },
      },
      { $unwind: "$studentUser" },

      { $sort: sort },

      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await Student.aggregate(pipeline);

    const docs = result[0].data;
    const total = result[0].total[0]?.count || 0;

    return {
      data: docs.map((doc) => ({
        id: doc.certificates._id,

        certificateNumber: doc.certificates.certificateNumber,
        status: doc.certificates.status,
        issuedAt: doc.certificates.issuedAt,

        course: doc.course
          ? {
              id: doc.course._id,
              title: doc.course.title,
              slug: doc.course.slug,
              coverImage: doc.course.coverImage,
            }
          : null,

        student: {
          fullname: doc.studentUser.fullname,
        },
      })),

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
  async listMyCertificatesUseCase(userId) {
    const student = await Student.findOne({ user: userId })
      .populate({
        path: "certificates.course",
        select: "title slug coverImage instructor",
        populate: {
          path: "instructor",
          populate: {
            path: "user",
            select: "fullname",
          },
        },
      })
      .populate({
        path: "user",
        select: "fullname",
      })
      .lean();

    if (!student) {
      return {
        data: [],
      };
    }

    const certificates = student.certificates
      .filter((c) => c.status === "issued")
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
      .map((cert) => ({
        id: cert._id.toString(),

        certificateNumber: cert.certificateNumber,
        certificateUrl: cert.certificateUrl,
        status: cert.status,
        issuedAt: cert.issuedAt,

        course: cert.course
          ? {
              id: cert.course._id,
              title: cert.course.title,
              slug: cert.course.slug,
              coverImage: cert.course.coverImage,
            }
          : null,

        student: {
          fullname: student.user.fullname,
        },

        instructor: {
          fullname: cert.course?.instructor?.user?.fullname || "LMS Academy",
        },
      }));

    return {
      data: certificates,
    };
  },
  async revokeCertificate(certId, actor) {
    const student = await Student.findOne({
      "certificates._id": certId,
    });

    if (!student) throw new AppError("Certificate not found", 404);

    const cert = student.certificates.id(certId);

    cert.status = "revoked";

    await student.save();

    await saveAuditLogs({
      entityType: "certificate",
      entityId: certId,
      action: "revoke_certificate",
      newData: mapCertificate(cert),
      updatedBy: actor.id,
    });

    return mapCertificate(cert);
  },
};
export default StudentCertificateService;
