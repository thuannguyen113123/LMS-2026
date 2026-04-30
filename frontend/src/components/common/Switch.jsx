import React from "react";

/**
 * Switch Toggle Component
 * @param {boolean} checked - trạng thái bật / tắt
 * @param {function} onChange - callback khi toggle
 * @param {boolean} disabled - disable switch
 * @param {string} size - sm | md | lg
 */
const Switch = ({
  checked = false,
  onChange,
  disabled = false,
  size = "md",
}) => {
  const sizeConfig = {
    sm: {
      wrapper: "w-8 h-4",
      circle: "w-3 h-3",
      translate: "translate-x-4",
    },
    md: {
      wrapper: "w-11 h-6",
      circle: "w-5 h-5",
      translate: "translate-x-5",
    },
    lg: {
      wrapper: "w-14 h-7",
      circle: "w-6 h-6",
      translate: "translate-x-7",
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`
        relative inline-flex items-center 
        ${config.wrapper}
        rounded-full 
        transition-colors duration-300
        ${checked ? "bg-green-500" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        focus:outline-none focus:ring-2 focus:ring-green-400
      `}
    >
      <span
        className={`
          inline-block bg-white rounded-full shadow
          transform transition-transform duration-300
          ${config.circle}
          ${checked ? config.translate : "translate-x-1"}
        `}
      />
    </button>
  );
};

export default Switch;
