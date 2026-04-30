import React, { useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { AiOutlineClose } from "react-icons/ai";

const CommonModal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg", // desktop mặc định
  maxHeight = "max-h-[80vh]", // tối đa height chuẩn
}) => {
  const modalRef = useRef(null);

  // ESC key để đóng modal
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // click backdrop để đóng modal
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`
          bg-card text-primary rounded-xl border border-border
          w-full
          ${maxWidth}       /* áp dụng biến maxWidth */
          ${maxHeight}      /* áp dụng biến maxHeight */
          p-4 sm:p-6 md:p-8
          relative overflow-auto flex flex-col
          animate-fade-in
        `}
      >
        {title && (
          <h2
            id="modal-title"
            className="text-lg sm:text-xl md:text-2xl font-semibold mb-4"
          >
            {title}
          </h2>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-primary opacity-60 hover:opacity-100 transition"
        >
          <AiOutlineClose size={20} />
        </button>

        {children}
      </div>
    </div>,
    document.body
  );
};

export default CommonModal;
