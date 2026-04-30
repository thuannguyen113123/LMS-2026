import React from "react";
import LMSLogo from "../logo/LMSLogo";

const BrandLoading = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-all">
      <div className="flex flex-col items-center animate-fade-in">
        <div className="animate-pulse drop-shadow-lg">
          <LMSLogo size={80} />
        </div>
        <p className="mt-4 text-blue-600 dark:text-blue-300 text-sm font-semibold tracking-wider animate-bounce">
          Đang tải hệ thống LMS...
        </p>
      </div>
    </div>
  );
};

export default BrandLoading;
