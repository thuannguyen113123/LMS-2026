import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiLogOut,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiMessageCircle,
  FiShoppingCart,
  FiUser,
} from "react-icons/fi";
import LMSLogo from "../logo/LMSLogo";
import { logoutApi } from "../../features/auth/authThunks";
import { fetchPublicCategories } from "../../features/category/categoriesThunks";
import useModal from "../../hooks/useModal";
import UserDropdown from "../Dropdown/UserDropdown";
import Navbar from "./Navbar";
import CartHover from "../hover/CartHover";
import NotificationHover from "../hover/NotificationHover";
import { selectPublicCategories } from "../../features/category/categoriesSlice";
import { updateThemeApi } from "../../features/users/usersThunks";
import { addToast, setTheme } from "../../features/ui/uiSlice";
import { selectMyNotifications } from "../../features/notifications/notificationSlice";

import { persistor } from "../../store/store";

import { useCart } from "../../hooks/Cart/useCart";
import { openModal } from "../../features/modal/modalSlice";

const Header = ({ overlay = false }) => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrollUp, setScrollUp] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.ui.theme);

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const notifications = useSelector(selectMyNotifications);

  const unreadMessages = useSelector(
    (state) => state.chatNotifications.unreadTotal
  );
  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    dispatch(setTheme(nextTheme));

    if (isAuthenticated) {
      dispatch(updateThemeApi(nextTheme));
    }
  };

  const { items: cartItems, totalItems, subtotal, removeItem } = useCart();

  const categories = useSelector(selectPublicCategories);

  useEffect(() => {
    dispatch(fetchPublicCategories());
  }, [dispatch]);

  useEffect(() => {
    let lastY = window.scrollY;
    const controlNavbar = () => {
      const currentY = window.scrollY;
      setScrollUp(currentY < lastY);
      lastY = currentY;
    };
    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutApi()).unwrap();

    await persistor.purge();

    navigate("/");
  };
  const authModal = useModal("AUTH");
  const handleChatClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();

      dispatch(
        openModal({
          key: "AUTH",
          data: { initialStep: "login" },
        })
      );

      dispatch(
        addToast({
          type: "info",
          message: "Bạn cần đăng nhập để sử dụng chat",
        })
      );

      return;
    }

    setMobileMenu(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full h-14 md:h-16 flex justify-center items-center transition-all duration-300 z-40 backdrop-blur-md ${
          overlay ? "bg-card/60 shadow-none" : "bg-card shadow-md"
        } ${
          scrollUp ? "translate-y-0" : "hidden md:-translate-y-full md:block"
        }`}
      >
        <div className="mx-auto w-full md:w-[85%] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 2xl:px-32 flex justify-between items-center h-14 md:h-16">
          <Link to="/">
            <LMSLogo className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" />
          </Link>

          <div className="hidden lg:block">
            <Navbar categories={categories} />
          </div>

          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <div className="h-11 w-11 flex items-center justify-center">
              <Link to="/cart">
                <CartHover
                  items={cartItems}
                  totalItems={totalItems}
                  subtotal={subtotal}
                  removeItem={removeItem}
                />
              </Link>
            </div>

            <div className="h-11 w-11 flex items-center justify-center">
              <Link
                to="/chat"
                onClick={handleChatClick}
                className="relative flex h-11 w-11 items-center justify-center leading-none rounded-full text-gray-700 dark:text-gray-300 hover:text-indigo-500 hover:bg-muted transition"
              >
                <FiMessageCircle size={22} />

                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
            </div>
            <div className="h-11 w-11 flex items-center justify-center">
              <button
                onClick={handleToggleTheme}
                className="relative flex h-11 w-11 items-center justify-center leading-none rounded-full text-gray-700 dark:text-gray-300 hover:text-indigo-500 hover:bg-muted transition"
              >
                {theme === "dark" ? <FiMoon size={22} /> : <FiSun size={22} />}
              </button>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-5">
                <div className="h-11 w-11 flex items-center justify-center">
                  <NotificationHover notifications={notifications} />
                </div>
                <UserDropdown user={user} onLogout={handleLogout} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => authModal.open({ initialStep: "login" })}
                  className="px-4 py-2 rounded-md border border-border hover:bg-muted transition"
                >
                  Login
                </button>
                <button
                  onClick={() => authModal.open({ initialStep: "register" })}
                  className="px-4 py-2 rounded-md bg-primary font-medium hover:opacity-90 transition"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-3">
            <button
              className="p-2 text-gray-700 hover:text-indigo-500 transition"
              onClick={() => setMobileMenu(true)}
            >
              <FiMenu size={26} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenu && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenu(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 z-50 h-dvh w-[88%] max-w-[360px] bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user?.avatar || "/avatar.png"}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      alt="avatar"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs opacity-60 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <LMSLogo />
                )}

                <button
                  onClick={() => setMobileMenu(false)}
                  className="p-2.5 rounded-lg hover:bg-muted active:scale-95 transition"
                >
                  <FiX size={22} />
                </button>
              </div>

              {/* Quick Actions */}
              {isAuthenticated && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenu(false)}
                    className="mobile-action-btn"
                  >
                    <FiShoppingCart size={18} />
                    <span>Cart</span>
                  </Link>

                  <Link
                    to="/chat"
                    onClick={handleChatClick}
                    className="mobile-action-btn"
                  >
                    <FiMessageCircle size={18} />
                    <span>Chat</span>
                  </Link>

                  <button
                    onClick={handleToggleTheme}
                    className="mobile-action-btn"
                  >
                    {theme === "dark" ? (
                      <FiMoon size={18} />
                    ) : (
                      <FiSun size={18} />
                    )}
                    <span>Theme</span>
                  </button>

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenu(false)}
                    className="mobile-action-btn"
                  >
                    <FiUser size={18} />
                    <span>Profile</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Scroll Area */}
            <nav className="flex-1 overflow-y-auto px-4 py-2">
              <div className="flex flex-col">
                <Link
                  to="/"
                  onClick={() => setMobileMenu(false)}
                  className="mobile-nav-item"
                >
                  Home
                </Link>

                <Link
                  to="/about"
                  onClick={() => setMobileMenu(false)}
                  className="mobile-nav-item"
                >
                  About
                </Link>

                <div className="pt-5 pb-2">
                  <p className="text-[11px] uppercase tracking-wider opacity-60">
                    Categories
                  </p>
                </div>

                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/categories/${c.id}`}
                    onClick={() => setMobileMenu(false)}
                    className="mobile-nav-item"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              {!isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setMobileMenu(false);
                      authModal.open({ initialStep: "login" });
                    }}
                    className="w-full py-2.5 rounded-lg border hover:bg-muted transition"
                  >
                    Login
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenu(false);
                      authModal.open({ initialStep: "register" });
                    }}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                  >
                    Sign up
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                >
                  <FiLogOut size={18} />
                  Logout
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
