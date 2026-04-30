import React from "react";
import { FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { ImFileEmpty } from "react-icons/im";

export const DataLoading = ({ message = "Đang tải dữ liệu..." }) => (
  <div className="py-12 flex flex-col items-center text-blue-600 dark:text-blue-300">
    <FaSpinner size={40} className="animate-spin" />
    <p className="mt-4 text-sm font-medium animate-pulse">{message}</p>
  </div>
);

export const DataEmpty = ({ message = "Không có dữ liệu" }) => (
  <div className="py-12 flex flex-col items-center text-gray-500 dark:text-gray-400">
    <ImFileEmpty size={40} />
    <p className="mt-4 text-sm font-medium">{message}</p>
  </div>
);

export const DataError = ({ message = "Đã xảy ra lỗi" }) => (
  <div className="py-12 flex flex-col items-center text-red-500 dark:text-red-400">
    <FaExclamationTriangle size={40} />
    <p className="mt-4 text-sm font-medium">{message}</p>
  </div>
);
