import React from "react";

const DateDivider = ({ label }) => {
  return (
    <div className="flex items-center my-4">
      <div className="grow border-t border-gray-300" />
      <span className="mx-4 text-sm text-gray-500 whitespace-nowrap">
        {label}
      </span>
      <div className="grow border-t border-gray-300" />
    </div>
  );
};

export default DateDivider;
