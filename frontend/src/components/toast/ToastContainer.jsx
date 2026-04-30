import React from "react";
import { useSelector } from "react-redux";
import Toast from "./Toast";

const ToastContainer = () => {
  const toasts = useSelector((state) => state.ui.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-1000 flex flex-col">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
