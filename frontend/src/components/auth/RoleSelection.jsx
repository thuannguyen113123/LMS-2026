import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserShield,
} from "react-icons/fa";
import { HiOutlineHand } from "react-icons/hi";
import { switchRoleApi } from "../../features/auth/authThunks";

const roleConfig = {
  student: {
    label: "Học viên",
    icon: <FaUserGraduate className="w-5 h-5" />,
    color: "from-blue-500 to-indigo-500",
  },
  instructor: {
    label: "Giảng viên",
    icon: <FaChalkboardTeacher className="w-5 h-5" />,
    color: "from-green-500 to-emerald-500",
  },
  admin: {
    label: "Quản trị",
    icon: <FaUserShield className="w-5 h-5" />,
    color: "from-purple-500 to-pink-500",
  },
};

const RoleSelection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading } = useSelector((state) => state.auth);

  const handleSelectRole = async (role) => {
    if (loading.switchRole) return;

    const res = await dispatch(switchRoleApi({ roleId: role.id }));

    if (switchRoleApi.fulfilled.match(res)) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-gray-800">
          <HiOutlineHand className="w-5 h-5 text-indigo-500" />
          Xin chào, <span className="text-indigo-600">{user?.fullname}</span>
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          Chọn vai trò bạn muốn sử dụng
        </p>
      </div>

      {/* Role list */}
      <div className="grid gap-3">
        {user?.roles?.map((role) => {
          const config = roleConfig[role.name] || {};
          const isActive = user?.activeRole?.id === role.id;

          return (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role)}
              disabled={loading.switchRole && !isActive}
              className={`
                group flex items-center justify-between px-4 py-3 rounded-xl
                border transition-all duration-300
                ${
                  isActive
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                    : "border-gray-200 hover:bg-gray-50 hover:shadow-sm hover:scale-[1.01]"
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg text-white bg-linear-to-r ${config.color}`}
                >
                  {config.icon}
                </div>

                {/* Text */}
                <div className="text-left">
                  <p className="font-medium text-gray-800">
                    {config.label || role.name}
                  </p>

                  {isActive && (
                    <span className="text-xs text-indigo-500 font-medium">
                      Đang sử dụng
                    </span>
                  )}
                </div>
              </div>

              {/* Right */}
              {loading.switchRole ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                <span className="text-gray-400 group-hover:translate-x-1 transition">
                  →
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelection;
