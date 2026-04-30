import React from "react";

const SwitchMethodButton = ({ method, toggleMethod, disabled }) => {
  const nextMethod = method === "email" ? "phone" : "email";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => toggleMethod(nextMethod)}
      className="
        text-sm font-medium
        text-blue-600 dark:text-blue-400
        hover:underline
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      Dùng {nextMethod === "email" ? "Email" : "Số điện thoại"} thay thế
    </button>
  );
};

export default SwitchMethodButton;
