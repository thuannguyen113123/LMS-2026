import React from "react";

const RecommendedSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-gray-100 rounded-2xl p-6 animate-pulse flex flex-col gap-3"
        >
          {/* Thumbnail */}
          <div className="w-full h-40 bg-gray-300 rounded-lg" />

          {/* Title */}
          <div className="h-5 bg-gray-300 rounded w-3/4" />

          {/* Instructor / info */}
          <div className="h-4 bg-gray-300 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

export default RecommendedSkeleton;
