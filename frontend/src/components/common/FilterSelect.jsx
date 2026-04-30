import React from "react";
import Select, { components as SelectComponents } from "react-select";
import { MdOutlineFilterAlt } from "react-icons/md";
const CustomDropdownIndicator = (props) => {
  return (
    <SelectComponents.DropdownIndicator {...props}>
      <MdOutlineFilterAlt className="text-gray-500 text-base" />
    </SelectComponents.DropdownIndicator>
  );
};

const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--color-card)",
    borderColor: state.isFocused ? "#3b82f6" : "var(--color-border)",
    boxShadow: state.isFocused ? "0 0 0 1.5px #3b82f6" : "none",
    color: "var(--color-text)",
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "var(--color-muted)"
      : "var(--color-card)",
    color: state.isSelected ? "#fff" : "var(--color-text)",
  }),

  placeholder: (base) => ({
    ...base,
    color: "var(--color-text)",
    opacity: 0.6,
  }),

  singleValue: (base) => ({
    ...base,
    color: "var(--color-text)",
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-card)",
    zIndex: 30,
  }),
};

const FilterSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Lọc dữ liệu...",
  isClearable = true,
  className = "",
}) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <Select
      styles={customStyles}
      options={options}
      value={selectedOption}
      onChange={(option) => onChange(option?.value ?? "All")}
      placeholder={placeholder}
      isClearable={isClearable}
      className={`min-w-[220px] ${className}`}
      classNamePrefix="react-select"
      components={{
        DropdownIndicator: CustomDropdownIndicator,
      }}
    />
  );
};

export default FilterSelect;
