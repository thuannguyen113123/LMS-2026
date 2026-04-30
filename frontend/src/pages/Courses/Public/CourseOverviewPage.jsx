import React, { useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import OverviewHeader from "../../../components/courses/OverviewHeader";
import OverviewSyllabus from "../../../components/courses/OverviewSyllabus";
import OverviewInstructor from "../../../components/courses/OverviewInstructor";
import OverviewSidebar from "../../../components/courses/OverviewSidebar";
import { fetchRecommendedCourses } from "../../../features/courses/coursesThunks";

import useLessonsByCourse from "../../../components/lesson/useLessonsByCourse";
import CommentsSection from "../../../components/comments/CommentsSection";
import OverviewIntroVideo from "../../../components/courses/OverviewIntroVideo";
import OverviewLearningGoals from "../../../components/courses/OverviewLearningGoals";
import CourseAudienceAndRequirements from "../../../components/courses/CourseAudienceAndRequirements";

import RecommendedCourses from "../../../components/courses/RecommendedCourses";
import FreeCourseSidebar from "../../../components/courses/FreeCourseSidebar";
import CourseOverviewSkeleton, {
  IntroVideoSkeleton,
  SyllabusSkeleton,
} from "../../../components/skeleton/CourseOverviewSkeleton";
import RecommendedSkeleton from "../../../components/skeleton/RecommendedSkeleton";
import { useCart } from "../../../hooks/Cart/useCart";
import useEnrollment from "./../../../hooks/Enrollment/useEnrollment";
import { selectRecommendedCourses } from "../../../features/courses/coursesSlice";

const CourseOverviewPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { course } = useOutletContext();

  useEffect(() => {
    if (course?.id) {
      dispatch(fetchRecommendedCourses({ courseId: course.id }));
    }
  }, [dispatch, course?.id]);
  const recommended = useSelector(selectRecommendedCourses);
  const recommendedLoading = useSelector((s) => s.courses.recommendedLoading);
  const { enrolled, enrolling, handleEnrollFree } = useEnrollment(
    course?.id,
    course?.slug,
    {
      initialEnrolled: course?.isEnrolled,
    }
  );

  const showEnrollButton = course?.isFree && !enrolled;
  const { lessons, lessonsLoading } = useLessonsByCourse(course?.slug);

  useEffect(() => {
    if (course?.canAccess) {
      navigate(`/courses/${course.slug}/learning`, { replace: true });
    }
  }, [course?.canAccess, course?.slug, navigate]);

  const syllabus = useMemo(() => {
    return [
      {
        lessons: lessons.map((l) => ({
          id: l.id,
          title: l.title,
          duration: l.duration,
          content: l.content,
          order: l.order,
        })),
      },
    ];
  }, [lessons]);

  if (!course) return <CourseOverviewSkeleton />;

  return (
    <div className="bg-app min-h-screen relative px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 pb-10 sm:pb-12 md:pb-16 lg:pb-20">
      {/* Background effect */}
      <div className="bg-app-overlay" />

      {/* HEADER */}
      <div className="pt-8 sm:pt-10 md:pt-12">
        <OverviewHeader course={course} />
      </div>

      {/* MAIN GRID */}
      <div
        className="
          grid grid-cols-1 gap-8 sm:gap-10 md:gap-12 lg:grid-cols-[2fr_1fr] lg:gap-14 mt-10 sm:mt-12 md:mt-14
        "
      >
        {/* LEFT COLUMN */}
        <div className="space-y-8 sm:space-y-10 md:space-y-12">
          {/* Intro Video */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 md:p-8 border border-border animate-fade-in">
            {lessonsLoading ? (
              <IntroVideoSkeleton />
            ) : (
              <OverviewIntroVideo videoURL={course.videoURL} />
            )}
          </div>

          {/* Audience & Requirements */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 md:p-10 border border-border">
            <CourseAudienceAndRequirements course={course} />
          </div>

          {/* Syllabus */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 md:p-10 border border-border">
            {lessonsLoading ? (
              <SyllabusSkeleton />
            ) : (
              <OverviewSyllabus syllabus={syllabus} />
            )}
          </div>

          {/* Learning Goals */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 md:p-10 border border-border">
            <OverviewLearningGoals goals={course.whatYouWillLearn} />
          </div>

          {/* Comments */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 md:p-10 border border-border">
            <CommentsSection targetType="course" targetId={course?.id} />
          </div>

          {/* Recommended Courses */}
          {recommended?.length > 0 && (
            <div className="bg-card rounded-2xl p-6 sm:p-8 md:p-10 border border-border">
              {recommendedLoading ? (
                <RecommendedSkeleton />
              ) : (
                <RecommendedCourses
                  courses={recommended}
                  categorySlug={course.category?.slug}
                />
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN / SIDEBAR */}
        <div className="relative">
          <div className="sticky top-20 sm:top-24 md:top-28 space-y-4 sm:space-y-6 md:space-y-8">
            {course.isFree ? (
              <FreeCourseSidebar
                course={course}
                enrolled={enrolled}
                enrolling={enrolling}
                handleEnrollFree={handleEnrollFree}
              />
            ) : (
              <OverviewSidebar course={course} addItem={addItem} />
            )}

            {!showEnrollButton && enrolled && (
              <button
                onClick={() => navigate(`/courses/${course.slug}/learning`)}
                className="w-full py-3 sm:py-4 rounded-xl font-semibold bg-primary hover:opacity-90 transition"
              >
                Vào học ngay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseOverviewPage;
