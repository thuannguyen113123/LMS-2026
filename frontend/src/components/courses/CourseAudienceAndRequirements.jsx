import React, { useMemo } from "react";
import { FaUserGraduate, FaLaptopCode, FaCheck } from "react-icons/fa";

// Hàm loại bỏ dấu phẩy thừa và khoảng trắng
const cleanText = (text = "") => text.replace(/,+$/, "").trim();

// Component từng item trong danh sách
const Item = ({ text }) => (
  <li className="flex items-start gap-2 sm:gap-3 md:gap-4 group">
    <span className="mt-1 flex h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0">
      <FaCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
    </span>

    <p className="text-xs sm:text-sm md:text-base leading-relaxed text-primary/80 group-hover:text-primary transition">
      {cleanText(text)}
    </p>
  </li>
);

// Card chứa title, icon, và list items
const Card = ({ title, icon, items }) => {
  if (!items?.length) return null;

  return (
    <div
      className="
        relative
        bg-card rounded-2xl border border-border
        p-4 sm:p-6 md:p-8
        pr-16 md:pr-20
        shadow-soft transition hover:-translate-y-1 hover:shadow-lg
        overflow-hidden
      "
    >
      {/* Watermark Icon */}
      <div
        className="
          absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6
          text-primary/5 pointer-events-none select-none
        "
        style={{
          fontSize: "3.5rem",
          lineHeight: 1,
        }}
      >
        {icon}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6 md:mb-8">
        <span className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-xl bg-primary-soft text-primary shadow-sm shrink-0">
          {icon}
        </span>

        <div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-primary leading-tight max-w-xs sm:max-w-sm md:max-w-md">
            {title}
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-primary/60 mt-1">
            {items.length} nội dung
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mb-4 sm:mb-6 md:mb-8" />

      {/* List */}
      <ul className="space-y-2 sm:space-y-3 md:space-y-4 max-w-full">
        {items.map((item, idx) => (
          <Item key={item + idx} text={item} />
        ))}
      </ul>
    </div>
  );
};

// Component chính
const CourseAudienceAndRequirements = ({ course }) => {
  const audience = useMemo(
    () => (course?.audience || []).filter(Boolean),
    [course?.audience]
  );

  const requirements = useMemo(
    () => (course?.requirements || []).filter(Boolean),
    [course?.requirements]
  );

  if (!audience.length && !requirements.length) return null;

  return (
    <section className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in px-2 sm:px-4 md:px-6 lg:px-8">
      {/* Section Title */}
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-primary mb-1 sm:mb-2">
          Khóa học này dành cho ai?
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-primary/70">
          Xác định rõ đối tượng và yêu cầu để đảm bảo bạn phù hợp trước khi tham
          gia.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
        {audience.length > 0 && (
          <Card
            title="Đối tượng phù hợp"
            items={audience}
            icon={<FaUserGraduate />}
          />
        )}

        {requirements.length > 0 && (
          <Card
            title="Yêu cầu đầu vào"
            items={requirements}
            icon={<FaLaptopCode />}
          />
        )}
      </div>
    </section>
  );
};

export default CourseAudienceAndRequirements;
