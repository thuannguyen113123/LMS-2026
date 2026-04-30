import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { selectPublicInstructors } from "../../features/instructor/instructorsSlice";
import { fetchPublicInstructors } from "../../features/instructor/instructorsThunks";

export default function InstructorsSection() {
  const dispatch = useDispatch();
  const instructors = useSelector(selectPublicInstructors);
  const loading = useSelector((state) => state.instructors.loading);
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (!instructors.length) {
      dispatch(fetchPublicInstructors({ limit: 8, sort: "rating" }));
    }
  }, [dispatch, instructors.length]);
  useEffect(() => {
    if (instructors.length && !active) {
      setActive(instructors[0]);
    }
  }, [instructors, active]);
  if (loading && !active) return null;
  if (!active) return null;
  return (
    <section className="bg-app py-16 sm:py-24 lg:py-32 relative">
      <div className="bg-app-overlay" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="mb-12 sm:mb-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div>
            <p className="text-sm opacity-60 mb-2 sm:mb-3">
              World Class Mentors
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug">
              Learn directly from <br />
              real industry experts
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative group w-full">
            <div className="absolute inset-0 bg-primary-soft rounded-2xl sm:rounded-[40px] blur-3xl opacity-40"></div>

            <img
              src={active.user?.avatar}
              className="relative w-full h-[300px] sm:h-[400px] md:h-[480px] lg:h-[520px] object-cover rounded-2xl sm:rounded-[40px] shadow-xl transition duration-500 group-hover:scale-[1.02]"
            />

            <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 bg-card px-4 sm:px-5 py-2 sm:py-4 rounded-xl shadow-soft border border-border">
              <p className="text-xs sm:text-sm opacity-60">Instructor</p>
              <p className="font-semibold text-sm sm:text-base">
                {active.user?.fullname}
              </p>
            </div>
          </div>
          <div className="animate-fade-in">
            <p className="text-sm opacity-60 mb-2 sm:mb-3">
              Instructor Spotlight
            </p>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 sm:mb-6">
              {active.user?.fullname}
            </h3>
            <p className="opacity-70 mb-6 sm:mb-10 max-w-full sm:max-w-xl text-sm sm:text-lg">
              {active.bio}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">
              <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border text-center">
                <p className="text-xl sm:text-3xl font-semibold">
                  {active.totalStudents?.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm opacity-60">Students</p>
              </div>

              <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border text-center">
                <p className="text-xl sm:text-3xl font-semibold flex items-center justify-center gap-1">
                  {active.rating?.average}{" "}
                  <span className="text-xs sm:text-sm opacity-60">★</span>
                </p>
                <p className="text-xs sm:text-sm opacity-60">
                  {active.rating?.count} Reviews
                </p>
              </div>

              <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border text-center">
                <p className="text-xl sm:text-3xl font-semibold">
                  {active.courses}
                </p>
                <p className="text-xs sm:text-sm opacity-60">Courses</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-10">
              {active.expertise?.map((e) => (
                <span
                  key={e}
                  className="px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-primary-soft text-xs sm:text-sm"
                >
                  {e}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Link to={`/profile/${active?.slug}`}>
                <button className="bg-primary px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base">
                  View Profile
                </button>
              </Link>
              <Link to={`/categories?instructor=${active?.slug}`}>
                <button className="bg-card border border-border px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base">
                  See Courses
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* CAROUSEL */}
        <div className="mt-12 sm:mt-16 lg:mt-24 relative group/swiper">
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView={1.1}
            grabCursor
            navigation
            breakpoints={{
              360: { slidesPerView: 1.1 },
              480: { slidesPerView: 1.3 },
              640: { slidesPerView: 1.5 },
              768: { slidesPerView: 2.1 },
              1024: { slidesPerView: 2.5 },
            }}
            className="instructor-swiper"
          >
            {instructors.map((ins) => {
              const isActive = active?.id === ins.id || active?._id === ins._id;

              return (
                <SwiperSlide key={ins.id || ins._id}>
                  <button
                    onClick={() => setActive(ins)}
                    className={`group w-full rounded-2xl overflow-hidden transition-all duration-300 ${
                      isActive
                        ? "border-primary shadow-xl -translate-y-1"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={ins.user?.avatar}
                        className="h-32 sm:h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>

                    <div className="p-2 sm:p-4 text-left">
                      <p className="font-medium text-sm sm:text-base">
                        {ins.user?.fullname}
                      </p>
                      <p className="text-xs sm:text-sm opacity-60 mb-1">
                        {ins.expertise?.[0]}
                      </p>
                      <div className="flex items-center justify-between text-xs sm:text-sm opacity-70">
                        <span className="flex items-center gap-1 justify-center">
                          {" "}
                          <FaStar color="gold" size={14} />{" "}
                          {ins.rating?.average}
                        </span>
                        <span>{ins.courses} courses</span>
                      </div>
                    </div>
                  </button>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
