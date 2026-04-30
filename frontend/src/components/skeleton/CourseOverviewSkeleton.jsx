import React from "react";

export const IntroVideoSkeleton = () => (
  <div className="animate-pulse h-60 bg-gray-200 rounded-2xl" />
);

export const SyllabusSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-5 bg-gray-300 rounded w-full" />
    ))}
  </div>
);

const CourseOverviewSkeleton = () => (
  <div className="bg-app min-h-screen px-6 lg:px-16 pb-20 animate-pulse">
    <div className="h-10 w-1/3 bg-gray-200 rounded mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-14">
      <div className="space-y-8">
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

export default CourseOverviewSkeleton;
