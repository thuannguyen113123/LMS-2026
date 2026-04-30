import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import CourseShowcaseItem from "./CourseShowcaseItem";
import useHomeCourses from "./../../hooks/Course/Public/useHomeCourses";

export default function NewCoursesSection() {
  const { courses, loading } = useHomeCourses("new");
  const gridRef = useRef(null);
  const hasAnimated = useRef(false);

  useLayoutEffect(() => {
    if (!gridRef.current) return;
    if (!courses.length) return;
    if (hasAnimated.current) return;

    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(
        gridRef.current.querySelectorAll("[data-course-card]")
      );
      gsap.set(cards, {
        autoAlpha: 0,
        y: 40,
      });

      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "all",
      });
    }, gridRef);

    return () => ctx.revert();
  }, [courses.length]);

  function SkeletonGrid() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[220px] gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-3xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <section className="mb-14">
        <SkeletonGrid />
      </section>
    );
  }
  return (
    <section className="mb-10 md:mb-14">
      {/* HEADER */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
            Khóa học mới
          </h2>
          <div className="h-1 w-14 bg-primary mt-3 mb-3 rounded-full" />
          <p className="text-sm text-neutral-500 max-w-md">
            Những khóa học vừa được xuất bản gần đây.
          </p>
        </div>
      </div>
      {/* GRID */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 auto-rows-[180px] sm:auto-rows-[200px] md:auto-rows-[240px] lg:auto-rows-[280px] xl:auto-rows-[240px] gap-4 sm:gap-5 md:gap-6 lg:gap-8"
      >
        {courses.slice(0, 5).map((course, index) => {
          let variant = "normal";
          if (index === 0) variant = "large";
          else if (index === 1) variant = "medium";

          return (
            <CourseShowcaseItem
              key={course.id}
              course={course}
              variant={variant}
            />
          );
        })}
      </div>
    </section>
  );
}
