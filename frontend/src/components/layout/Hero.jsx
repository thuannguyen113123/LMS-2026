import React, { useEffect, useRef } from "react";
import { FaStar } from "react-icons/fa";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroSearch from "./HeroSearch";
import { useDispatch, useSelector } from "react-redux";
import {
  selectHeroStats,
  selectHeroTopCourse,
  selectStatsLoading,
} from "../../features/stats/statsSlice";
import { fetchHeroStats } from "../../features/stats/statsThunks";
import { Link } from "react-router-dom";
import { openModal } from "../../features/modal/modalSlice";
import { addToast } from "../../features/ui/uiSlice";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const heroRef = useRef();
  const imageRef = useRef();
  const cardRef = useRef();
  const dispatch = useDispatch();
  const heroStats = useSelector(selectHeroStats);
  const loading = useSelector(selectStatsLoading);
  const topCourse = useSelector(selectHeroTopCourse);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchHeroStats());
  }, [dispatch]);
  const stats = [
    { value: heroStats.courses, label: "Courses" },
    { value: heroStats.students, label: "Students" },
    { value: heroStats.instructors, label: "Instructors" },
    { value: heroStats.completionRate, label: "Completion rate" },
  ];

  useEffect(() => {
    if (!heroStats) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".stat-number").forEach((el) => {
        el.innerText = 0;
      });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-item", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
      })
        .from(
          imageRef.current,
          {
            x: 60,
            opacity: 0,
            duration: 1,
          },
          "-=0.6"
        )
        .from(
          cardRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        );
      gsap.to(cardRef.current, {
        y: -12,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.utils.toArray(".stat-number").forEach((el) => {
        const value = Number(el.dataset.value);
        gsap.fromTo(
          el,
          { innerText: 0 },
          {
            innerText: value,
            duration: 1.6,
            snap: { innerText: 1 },
            ease: "power1.out",
            onUpdate: function () {
              if (el.dataset.label === "Completion rate") {
                el.innerText = Number(el.innerText).toFixed(1) + "%";
              }
            },
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
            },
          }
        );
      });
    }, heroRef);

    return () => ctx.revert();
  }, [heroStats]);

  const handleBecomeInstructor = () => {
    if (!isAuthenticated) {
      dispatch(
        openModal({
          key: "AUTH",
          data: { initialStep: "login" },
        })
      );
      return;
    }

    const hasRole = (user?.roles || []).some((r) =>
      ["instructor", "admin"].includes(r.name)
    );

    if (hasRole) {
      dispatch(
        addToast({
          type: "info",
          message: "Bạn đã là giảng viên hoặc admin rồi",
        })
      );
      return;
    }

    dispatch(openModal({ key: "INSTRUCTOR_REQUEST" }));
  };
  return (
    <section
      ref={heroRef}
      className="bg-app w-full pt-20 pb-14 md:pt-2 md:pb-16 lg:min-h-[80vh] flex items-start lg:items-center overflow-visible"
    >
      <div className=" mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 w-full">
        <div className="grid xl:grid-cols-2 gap-10 md:gap-12 lg:gap-14 items-center overflow-visible">
          <div className="text-center">
            <div className="hero-item inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-soft text-sm mb-6">
              New LMS Platform
            </div>

            <h1 className="hero-item text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.3] font-semibold line-height: 1.25 mb-6">
              Learn Faster
              <br />
              With Modern Courses
            </h1>

            <p className="hero-item text-gray-500 dark:text-gray-400 text-lg mb-8  ">
              Upgrade your skills with structured courses, real projects, and
              top instructors.
            </p>

            <div className="flex justify-center">
              {" "}
              <HeroSearch />
            </div>

            {/* BUTTONS */}
            <div className="hero-item flex flex-col justify-center sm:flex-row gap-3 sm:gap-4 mt-6">
              <Link
                to={"/categories"}
                className="bg-primary text-center px-6 py-3 rounded-xl"
              >
                Explore Courses
              </Link>

              <button
                onClick={handleBecomeInstructor}
                className="bg-primary-soft px-6 py-3 rounded-xl"
              >
                Become Instructor
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mt-12 text-center">
              {stats.map((s, i) => (
                <div key={i}>
                  <div
                    className="text-2xl font-semibold stat-number"
                    data-value={s.value}
                    data-label={s.label}
                  >
                    {loading ? "..." : 0}
                  </div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div
            ref={imageRef}
            className="relative mt-10 lg:mt-0 hidden xl:block"
          >
            <div className="relative">
              <img
                src={topCourse?.thumbnail}
                alt={topCourse?.title}
                className="rounded-xl sm:rounded-2xl w-full h-[220px] sm:h-[300px] md:h-[420px] lg:h-[480px] object-cover"
              />
            </div>

            <div
              ref={cardRef}
              className="absolute bottom-5 top-auto sm:top-5 sm:bottom-auto left-1/2 -translate-x-1/2 md:-left-6 md:translate-x-0 bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg w-full max-w-md sm:w-auto"
            >
              {topCourse && (
                <>
                  <p className="text-sm text-gray-500">Popular</p>

                  <p className="font-semibold">{topCourse.title}</p>

                  <p className="text-sm text-gray-500 flex gap-1">
                    {topCourse.rating}{" "}
                    <FaStar className="text-yellow-400 w-4 h-4" /> •{" "}
                    {topCourse.totalStudents} students
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
