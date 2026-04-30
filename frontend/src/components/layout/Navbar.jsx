import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export default function Navbar({ categories = [] }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const links = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="hidden md:flex items-center gap-6 font-bold text-primary ">
      <Link
        to="/"
        className={`relative px-3 py-1 transition-colors duration-200 ${
          isActive("/")
            ? "text-indigo-600 after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600"
            : "hover:text-indigo-600"
        }`}
      >
        Home
      </Link>

      <div className="relative group">
        <button className="flex items-center gap-1 px-3 py-1 transition-colors duration-200 group-hover:text-indigo-600">
          Categories
          <ChevronDown
            size={18}
            className="transition-transform duration-300 group-hover:rotate-180"
          />
        </button>

        <div className="absolute left-0 top-full w-full h-3"></div>

        <div className="absolute left-0 top-full">
          <div className="dropdown-menu animate-fade-in">
            {categories.length > 0 ? (
              <div className="dropdown-grid">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/categories/${c.slug}`}
                    className="dropdown-btn"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No categories</p>
            )}
          </div>
        </div>
      </div>

      {links.slice(1).map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`relative px-3 py-1 transition-colors duration-200 ${
            isActive(link.path)
              ? "text-indigo-600 after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600"
              : "hover:text-indigo-600"
          }`}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
}
