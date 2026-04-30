import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const ModernHeroSection = ({
  title,
  subtitle,
  categories = [],
  basePath = "/categories",
}) => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-app overflow-hidden border-b border-border">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24 pb-14 sm:pb-16 md:pb-20">
        {/* ===== BREADCRUMB ===== */}
        <div className="flex items-center text-xs sm:text-sm text-neutral-500 mb-4 sm:mb-6">
          <span
            onClick={() => navigate("/")}
            className="cursor-pointer hover:text-primary transition"
          >
            Trang chủ
          </span>
          <ChevronRight className="w-4 h-4 mx-1 sm:mx-2" />
          <span className="text-primary font-medium">{title}</span>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            {title}
          </h1>

          <p className="mt-4 sm:mt-5 md:mt-6 text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {subtitle}
          </p>

          {/* CTA */}
          <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/courses")}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-primary text-xs sm:text-sm font-semibold hover:opacity-90 transition"
            >
              Khám phá khóa học
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===== CATEGORY SWIPER ===== */}
        {categories.length > 0 && (
          <div className="mt-8 sm:mt-10 md:mt-12">
            <Swiper
              spaceBetween={8}
              slidesPerView={"auto"}
              grabCursor={true}
              breakpoints={{
                360: { spaceBetween: 8 },
                640: { spaceBetween: 10 },
                768: { spaceBetween: 12 },
                1024: { spaceBetween: 14 },
              }}
            >
              {categories.slice(0, 12).map((cat) => (
                <SwiperSlide key={cat.id} style={{ width: "auto" }}>
                  <button
                    onClick={() => navigate(`${basePath}/${cat.slug}`)}
                    className="whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm border border-border bg-primary-soft hover-bg-muted transition-all duration-200"
                  >
                    {cat.name}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
};

export default ModernHeroSection;
