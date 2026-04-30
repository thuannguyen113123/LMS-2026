import React, { useState } from "react";

const DropdownBase = ({
  trigger,
  children,
  align = "right",
  width = "w-56",
  onOpenChange,
}) => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      onOpenChange && onOpenChange(next);
      return next;
    });
  };

  const close = () => {
    setOpen(false);
    onOpenChange && onOpenChange(false); // <-- callback khi đóng
  };

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        className="inline-flex items-center cursor-pointer"
      >
        {trigger}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close}></div>

          <div
            className={`absolute top-full mt-2 ${
              align === "right" ? "right-0" : "left-0"
            } ${width}  rounded-lg shadow-xl border animate-slideDown z-50`}
          >
            {typeof children === "function" ? children({ close }) : children}
          </div>
        </>
      )}
    </div>
  );
};

export default DropdownBase;
