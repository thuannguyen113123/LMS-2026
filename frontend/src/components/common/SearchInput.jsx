import React from "react";
import { FiSearch } from "react-icons/fi";

const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative border-white border-2 rounded-lg shadow px-3 py-2 flex items-center w-full lg:w-64">
    <FiSearch className="text-primary mr-2" />
    <input
      type="text"
      placeholder={placeholder}
      className="outline-none w-full text-sm text-primary"
      value={value}
      onChange={onChange}
    />
  </div>
);
export default SearchInput;
