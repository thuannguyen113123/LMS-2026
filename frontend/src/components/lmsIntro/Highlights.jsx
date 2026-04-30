import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { watchImg } from "../../utils/index";
import { FaProjectDiagram, FaSmile, FaGraduationCap } from "react-icons/fa";
import VideoCarousel from "./VideoCarousel";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHighlightStats } from "../../features/stats/statsThunks";
import { selectHighlightStats } from "../../features/stats/statsSlice";
import { Link } from "react-router-dom";
import { openModal } from "../../features/modal/modalSlice";

const Highlights = () => {
  const containerRef = useRef();
  const dispatch = useDispatch();
  const stats = useSelector(selectHighlightStats);

  const handleWatchDemo = () => {
    dispatch(openModal({ key: "MODAL_DEMO" }));
  };

  useEffect(() => {
    dispatch(fetchHighlightStats());
  }, [dispatch]);

  useGSAP(
    (context) => {
      const q = context.selector;

      gsap.set(q(".highlight-stats-item"), {
        opacity: 0,
        y: 30,
      });

      gsap.set(q(".highlight-cta"), {
        opacity: 0,
        y: 30,
      });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      tl.fromTo(
        q(".highlight-eyebrow"),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          q(".highlight-title"),
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1 },
          "-=0.4"
        )
        .fromTo(
          q(".highlight-subtitle"),
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.6"
        )
        .fromTo(
          q(".highlight-desc"),
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.6"
        )
        .to(q(".highlight-stats-item"), {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
        })
        .to(
          q(".highlight-cta"),
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.2,
          },
          "-=0.5"
        );
    },
    {
      scope: containerRef,
      revertOnUpdate: true,
    }
  );

  return (
    <section
      ref={containerRef}
      className="bg-app min-h-screen py-16 sm:py-24 lg:py-40 relative mt-30"
    >
      {/* subtle background effect */}
      <div className="bg-app-overlay opacity-40"></div>

      <div className="w-full px-8 grid lg:grid-cols-2 gap-24 items-center relative z-10">
        {/* LEFT CONTENT */}
        <div className="max-w-2xl space-y-8">
          {/* EYEBROW */}
          <div className="highlight-eyebrow">
            <span className="text-sm uppercase tracking-[0.2em] text-accent font-medium opacity-80">
              Interactive Learning
            </span>
          </div>

          {/* TITLE */}
          <h1 className="highlight-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
            Learn In-Demand Skills with Guided Courses
          </h1>

          {/* SUBTITLE */}
          <p className="highlight-subtitle text-lg md:text-xl text-accent opacity-70">
            Learn step-by-step with structured lessons designed to help you
            build real skills.
          </p>

          {/* DESCRIPTION */}
          <p className="highlight-desc text-lg text-primary opacity-70">
            Join thousands of learners who’ve completed structured courses,
            gained practical skills, and accelerated their careers in weeks.
          </p>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="highlight-stats-item flex items-center gap-4 p-4 bg-card rounded-2xl shadow-sm hover:shadow-lg transition">
              <FaProjectDiagram className="w-6 h-6 text-primary" />
              <div>
                <div className="text-3xl font-semibold">
                  {stats.completedCourses}+
                </div>
                <div className="text-sm opacity-60">Courses Completed</div>
              </div>
            </div>

            <div className="highlight-stats-item flex items-center gap-4 p-4 bg-card rounded-2xl shadow-sm hover:shadow-lg transition">
              <FaSmile className="w-6 h-6 text-primary" />
              <div>
                <div className="text-3xl font-semibold">
                  {stats.satisfactionRate}%
                </div>
                <div className="text-sm opacity-60">Student Satisfaction</div>
              </div>
            </div>

            <div className="highlight-stats-item flex items-center gap-4 p-4 bg-card rounded-2xl shadow-sm hover:shadow-lg transition">
              <FaGraduationCap className="w-6 h-6 text-primary" />
              <div>
                <div className="text-3xl font-semibold">
                  {stats.careerAdvancementRate}%
                </div>
                <div className="text-sm opacity-60">Career Advancement</div>
              </div>
            </div>
          </div>

          {/* PRIMARY CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Link
              to="/categories?price=free"
              className="highlight-cta bg-linear-to-r from-primary to-secondary border border-gray-200 px-8 py-4 rounded-full font-medium flex items-center gap-2 hover:scale-105 transition"
            >
              Start Free Course
            </Link>

            <button
              onClick={handleWatchDemo}
              className="highlight-cta bg-primary px-8 py-4 rounded-full font-medium flex items-center gap-2 hover:scale-105 transition"
            >
              Watch Platform Demo
              <img src={watchImg} className="w-5 opacity-80" />
            </button>
          </div>
        </div>

        {/* RIGHT VIDEO */}
        <div className="highlight-video w-full bg-card rounded-3xl border border-border overflow-hidden p-4">
          <VideoCarousel />
        </div>
      </div>
    </section>
  );
};

export default Highlights;
