import { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Keyboard } from "swiper/modules";
import { useDispatch, useSelector } from "react-redux";

import "swiper/css";
import "swiper/css/pagination";
import CourseCardProccess from "../../../components/Card/CourseCardProccess";
import { getContinueLearning } from "../../../features/courses/coursesThunks";
import { selectContinueLearningCourses } from "../../../features/courses/coursesSlice";

export default function ContinueLearning() {
  const dispatch = useDispatch();

  const courses = useSelector(selectContinueLearningCourses);
  const loading = useSelector(
    (state) => state.courses.loading.continueLearning
  );
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?.activeRole?.name === "student") {
      dispatch(getContinueLearning());
    }
  }, [dispatch, isAuthenticated, user]);

  if (loading) return null;
  if (!courses.length) return null;

  return (
    <section className="mt-12 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Continue learning</h2>
          <p className="text-sm opacity-70">
            Jump back in and keep your progress going.
          </p>
        </div>

        <p className="text-xs opacity-60 hidden md:block">Swipe or drag</p>
      </div>

      <Swiper
        modules={[Pagination, Keyboard]}
        grabCursor
        keyboard={{ enabled: true }}
        pagination={{ clickable: true }}
        breakpoints={{
          0: {
            slidesPerView: 1.1,
            spaceBetween: 12,
          },
          640: {
            slidesPerView: 1.2,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 1.5, // 👈 tablet dọc
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 1.8, // 👈 tablet ngang (KEY)
            spaceBetween: 24,
          },
          1280: {
            slidesPerView: 2.2, // desktop
            spaceBetween: 24,
          },
        }}
        className="pb-2"
      >
        {courses.map((course) => (
          <SwiperSlide key={course?.id}>
            <CourseCardProccess course={course} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
