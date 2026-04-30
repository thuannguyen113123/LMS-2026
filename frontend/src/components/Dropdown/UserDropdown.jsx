import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiSettings,
  FiBookmark,
  FiLogOut,
  FiAward,
  FiRepeat,
} from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { ChevronDown } from "lucide-react";
import Dropdown from "./DropdownBase";
import { openModal } from "../../features/modal/modalSlice";
import { MODAL_SETTINGS } from "../modal/SettingsModal";
import { useDispatch } from "react-redux";
import { MODAL_CERTIFICATES_OPTION } from "../modal/CertificateModal";
import { MODAL_ROLE } from "../modal/RoleModal";

const UserDropdown = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  return (
    <Dropdown
      onOpenChange={(state) => setOpen(state)}
      trigger={
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-medium hover:bg-muted transition cursor-pointer">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${
                user?.fullname || "U"
              }&background=random`
            }
            alt="avatar"
            className="w-9 h-9 rounded-full border border-border"
          />

          <ChevronDown
            size={18}
            className={`transition-transform duration-300 ${
              open ? "rotate-180 text-primary" : "text-primary"
            }`}
          />
        </div>
      }
    >
      {({ close }) => (
        <div className="animate-fade-in bg-card">
          <div className="px-4 py-3 text-sm border-b border-border">
            <p className="opacity-70">Signed in as</p>
            <p
              className="font-semibold truncate"
              title={user?.email || user?.fullname}
            >
              {user?.email || user?.fullname}
            </p>
          </div>
          <Link
            to="/profile"
            onClick={close}
            className="dropdown-btn flex items-center gap-2"
          >
            <FiUser /> Profile
          </Link>

          <Link
            to="/dashboard"
            onClick={close}
            className="dropdown-btn flex items-center gap-2"
          >
            <MdDashboard /> Dashboard
          </Link>
          {user?.roles?.length > 1 && (
            <button
              onClick={() => {
                dispatch(openModal({ key: MODAL_ROLE }));
                close();
              }}
              className="dropdown-btn flex items-center gap-2"
            >
              <FiRepeat /> Switch Role
            </button>
          )}
          <button
            onClick={() => {
              dispatch(openModal({ key: MODAL_SETTINGS }));
              close();
            }}
            className="dropdown-btn flex items-center gap-2"
          >
            <FiSettings /> Settings
          </button>
          <button
            onClick={() => {
              dispatch(openModal({ key: MODAL_CERTIFICATES_OPTION }));
              close();
            }}
            className="dropdown-btn flex items-center gap-2"
          >
            <FiAward /> Certificates
          </button>
          <Link
            to="/myBookMark"
            onClick={close}
            className="dropdown-btn flex items-center gap-2"
          >
            <FiBookmark /> My Bookmark
          </Link>
          {/* LOGOUT */}
          <button
            onClick={() => {
              onLogout();
              close();
            }}
            className="dropdown-btn text-red-500 flex items-center gap-2"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      )}
    </Dropdown>
  );
};

export default UserDropdown;
