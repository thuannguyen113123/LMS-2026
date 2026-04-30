import { FiMenu, FiSun, FiMoon } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../features/ui/uiSlice";
import { updateThemeApi } from "../../features/users/usersThunks";
import NotificationHover from "../hover/NotificationHover";
import UserDropdown from "../Dropdown/UserDropdown";
import { selectMyNotifications } from "../../features/notifications/notificationSlice";
import { Link, useNavigate } from "react-router-dom";
import LMSLogo from "../logo/LMSLogo";
import { logoutApi } from "../../features/auth/authThunks";
import { persistor } from "../../store/store";

const DashboardHeader = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const theme = useSelector((state) => state.ui.theme);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const notifications = useSelector(selectMyNotifications);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    dispatch(setTheme(nextTheme));

    if (isAuthenticated) {
      dispatch(updateThemeApi(nextTheme));
    }
  };
  const handleLogout = async () => {
    await dispatch(logoutApi()).unwrap();

    await persistor.purge();

    navigate("/");
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-14 md:h-16 bg-card border-b z-40 flex items-center justify-between px-3 sm:px-4 md:px-8 lg:px-10 xl:px-12">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <Link to="/">
          <LMSLogo className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" />
        </Link>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <div className="h-10 w-10 flex items-center justify-center">
          <NotificationHover notifications={notifications} />
        </div>
        {/* Theme */}
        <button
          onClick={handleToggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition"
        >
          {theme === "dark" ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>

        {/* Toggle sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-muted transition"
        >
          <FiMenu size={22} />
        </button>
        {/* User */}
        <UserDropdown user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
};

export default DashboardHeader;
