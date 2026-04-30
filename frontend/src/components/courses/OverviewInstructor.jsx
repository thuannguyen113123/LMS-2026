import React from "react";
import {
  FaStar,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaAward,
  FaInfoCircle,
} from "react-icons/fa";

const OverviewInstructor = ({ instructor }) => {
  if (!instructor) return null;

  const {
    user,
    bio,
    rating = { average: 0, count: 0 },
    expertise = [],
    totalStudents = 0,
  } = instructor;

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-lg p-6">
      {/* HEADER */}
      <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        <FaChalkboardTeacher className="text-indigo-600" />
        Giảng viên
      </h2>

      {/* PROFILE */}
      <div className="flex items-center gap-4">
        <img
          src={user?.avatar || "/default-avatar.png"}
          alt={user?.fullname}
          className="w-20 h-20 rounded-full object-cover border shadow"
        />

        <div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {user?.fullname}
          </p>

          {/* RATING */}
          <div className="flex items-center gap-2 mt-1">
            <FaStar className="text-yellow-400" />
            <span className="font-semibold">{rating.average.toFixed(1)}</span>
            <span className="text-sm text-gray-500">
              ({rating.count} đánh giá)
            </span>
          </div>

          {/* STUDENTS */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <FaUserGraduate />
            {totalStudents} học viên
          </div>
        </div>
      </div>

      {/* BIO */}
      <div className="mt-6">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200 mb-2">
          <FaInfoCircle />
          Giới thiệu
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {bio?.trim() || "Giảng viên chưa cập nhật tiểu sử."}
        </p>
      </div>

      {/* EXPERTISE */}
      {expertise.length > 0 && (
        <div className="mt-6">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200 mb-2">
            <FaAward />
            Chuyên môn
          </h3>

          <div className="flex flex-wrap gap-2">
            {expertise.map((exp, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-sm rounded-full
                           bg-indigo-50 dark:bg-indigo-900/30
                           text-indigo-700 dark:text-indigo-300
                           border border-indigo-100 dark:border-indigo-800"
              >
                {exp}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default OverviewInstructor;
