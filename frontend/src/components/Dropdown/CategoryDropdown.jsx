// src/components/header/Dropdown/CategoryDropdown.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import DropdownBase from "./DropdownBase";

const CategoryDropdown = ({ categories = [] }) => {
  return (
    <DropdownBase
      trigger={
        <button className="flex items-center gap-1 hover:text-indigo-500 transition">
          Categories <FiChevronDown size={16} />
        </button>
      }
      align="left"
      width="w-96"
    >
      {() => (
        <div className="p-4 text-gray-700 dark:text-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {categories.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 text-sm">
                No categories found
              </p>
            ) : (
              categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/categories/${c.slug}`}
                  className="block px-3 py-2 rounded-md hover:bg-indigo-50 dark:hover:bg-gray-800 text-sm transition"
                >
                  {c.name}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </DropdownBase>
  );
};

export default CategoryDropdown;
