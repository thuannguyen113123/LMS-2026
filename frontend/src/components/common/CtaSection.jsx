import React from "react";
import { Link } from "react-router-dom";

const CtaSection = () => {
  return (
    <section className="bg-app py-20 sm:py-24 md:py-28 lg:py-32 mt-30">
      {/* subtle background */}
      <div className="bg-app-overlay absolute inset-0" />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 md:p-14 lg:p-20 text-center">
          {/* label */}
          <p className="text-xs sm:text-sm tracking-[0.25em] text-primary/60 mb-4 sm:mb-6">
            START LEARNING TODAY
          </p>

          {/* headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-snug md:leading-tight max-w-3xl mx-auto mb-6">
            Upgrade your skills with structured learning
          </h2>

          {/* description */}
          <p className="text-primary/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10">
            Practical courses, real projects, and a clear roadmap to help you
            master modern skills faster.
          </p>

          {/* buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-10">
            <Link
              to="/categories"
              className="bg-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-medium hover:opacity-90 transition text-center"
            >
              Start learning
            </Link>

            <Link
              to="/categories"
              className="bg-primary-soft px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-medium hover:opacity-80 transition text-center"
            >
              Browse courses
            </Link>
          </div>

          {/* trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm md:text-base text-primary/60">
            <span>Build real-world projects</span>
            <span className="hidden sm:inline">•</span>
            <span>Job-ready skills in 8–12 weeks</span>
            <span className="hidden sm:inline">•</span>
            <span>Frontend → Backend → Fullstack</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
