import React from "react";

const STATUS_MAP = {
  active: {
    label: "Active",
    className: "bg-green-100 text-green-700",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-700",
  },
  verified: {
    label: "Verified",
    className: "bg-blue-100 text-blue-700",
  },
  unverified: {
    label: "Unverified",
    className: "bg-yellow-100 text-yellow-700",
  },
  not_started: {
    label: "Not started",
    className: "bg-gray-100 text-gray-700",
  },

  in_progress: {
    label: "In progress",
    className: "bg-blue-100 text-blue-700",
  },

  quiz_pending: {
    label: "Quiz pending",
    className: "bg-yellow-100 text-yellow-700",
  },

  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700",
  },
  published: {
    label: "published",
    className: "bg-green-500 text-white",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700",
  },
  locked: {
    label: "Locked",
    className: "bg-red-100 text-red-700",
  },
  unlocked: {
    label: "Unlocked",
    className: "bg-green-100 text-green-700",
  },
  system: {
    label: "System",
    className: "bg-purple-100 text-purple-700",
  },
  custom: {
    label: "Custom",
    className: "bg-gray-100 text-gray-700",
  },
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-600",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-600",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-600",
  },
  draft: {
    label: "draft",
    className: "bg-gray-100 text-gray-700",
  },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_MAP[status?.toLowerCase()];
  if (!config) return null;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
