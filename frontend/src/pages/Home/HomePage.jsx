import React from "react";

import Hero from "./../../components/layout/Hero";
import NewCoursesSection from "./../../components/layout/NewCoursesSection";
import ContinueLearning from "../Courses/Public/ContinueLearning";
import Highlights from "./../../components/lmsIntro/Highlights";
import InstructorsSection from "./../../components/instructor/InstructorsSection";
import TestimonialsSection from "./../../components/testimonials/TestimonialsSection";
import CtaSection from "./../../components/common/CtaSection";
import FeaturedDiscountBanner from "../../components/common/FeaturedDiscountBanner";

const HomePage = () => {
  return (
    <div className="sm:px-6 lg:px-12 xl:px-24 2xl:px-48 overflow-visible">
      <Hero />
      <NewCoursesSection />
      <ContinueLearning />
      <FeaturedDiscountBanner />
      <Highlights />
      <InstructorsSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  );
};

export default HomePage;
