export const NOTIFICATION_TYPE = {
  COURSE: {
    NEW: "course_new",
    PURCHASED: "course_purchased",
    COMMENT: "course_comment",
  },

  USER: {
    REGISTERED: "user_registered",
    REPORT: "user_report",
  },

  INSTRUCTOR: {
    REQUEST: "instructor_upgrade_request",
    APPROVED: "instructor_approved",
    REJECTED: "instructor_rejected",
    ENROLLED: "student_enrolled",
  },

  CONTACT: {
    MESSAGE: "contact_message",
  },
};
export const NOTIFICATION_UI_CONFIG = {
  course_new: {
    icon: "book",
    color: "text-indigo-500",
    bg: "bg-primary-soft",
    route: (n) => `/courses/${n.entityId}`,
    meta: (m) => `Course ID: ${m.courseId}`,
  },

  course_purchased: {
    icon: "book",
    color: "text-emerald-500",
    bg: "bg-primary-soft",
    route: (n) => `/courses/${n.entityId}`,
    meta: (m) => `Order #${m.orderId}`,
  },

  course_comment: {
    icon: "comment",
    color: "text-purple-500",
    bg: "bg-primary-soft",
    route: (n) => `/courses/${n.entityId}`,
    meta: (m) => m.preview,
  },

  user_registered: {
    icon: "user",
    color: "text-primary",
    bg: "bg-primary-soft",
    route: (n) => `/admin/users/${n.meta?.userId}`,
    meta: (m) => m.email,
  },

  user_report: {
    icon: "alert",
    color: "text-red-500",
    bg: "bg-primary-soft",
    meta: (m) => `Reported by ${m.reportedBy}`,
  },

  instructor_upgrade_request: {
    icon: "shield",
    color: "text-amber-500",
    bg: "bg-primary-soft",
    route: () => `/admin/instructor-requests`,
    actions: true,
    meta: (m) => `${m.userName} requested upgrade`,
  },

  instructor_approved: {
    icon: "check",
    color: "text-green-500",
    bg: "bg-primary-soft",
    route: () => `/instructor/dashboard`,
  },

  instructor_rejected: {
    icon: "x",
    color: "text-red-500",
    bg: "bg-primary-soft",
    route: () => `/instructor/apply`,
  },

  contact_message: {
    icon: "mail",
    color: "text-blue-500",
    bg: "bg-primary-soft",
    route: (n) => `/admin/contacts/${n.entityId}`,
  },
};
