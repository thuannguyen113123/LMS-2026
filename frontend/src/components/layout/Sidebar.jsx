import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectSidebarModules } from "../../features/modules/modulesSlice";
import { iconMap } from "../../constants/iconMap";

const Sidebar = ({ sidebarOpen }) => {
  const navGroups = useSelector(selectSidebarModules);

  const renderGroup = (title, items) => {
    if (!items?.length) return null;

    return (
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase px-4 mb-3 tracking-wider">
          {title}
        </h2>

        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                className={({ isActive }) =>
                  `group flex items-center md:justify-center lg:justify-start gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  }`
                }
              >
                {Icon && (
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                )}
                <span className="whitespace-nowrap md:hidden lg:block">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`
      fixed top-0 left-0 z-40 h-screen bg-app border-r border-gray-200
      flex flex-col transition-all duration-300 ease-in-out w-64
  
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    `}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link to={"/dashboard"}>
          <h1 className="text-xl font-bold text-blue-600 tracking-tight">
            LMS Dashboard
          </h1>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {renderGroup("Main", navGroups.main)}
        {renderGroup("Management", navGroups.management)}
        {renderGroup("Others", navGroups.others)}
      </nav>

      {/* Footer */}
      <div className="text-xs text-gray-400 px-6 py-4 border-t border-gray-100">
        © {new Date().getFullYear()} LMS Inc.
      </div>
    </aside>
  );
};

export default Sidebar;
