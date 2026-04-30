import React from "react";
import {
  ShoppingCart,
  CreditCard,
  Users,
  Layers,
  Award,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/Cart/useCart";

const CoursePurchaseBox = ({ course, addItem }) => {
  const formatPrice = (p) =>
    p?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const discountPercent =
    course.price > course.discountPrice
      ? Math.round(((course.price - course.discountPrice) / course.price) * 100)
      : 0;

  const fullStars = Math.floor(course.rating);
  const hasHalfStar = course.rating - fullStars >= 0.5;
  const navigate = useNavigate();
  const { clearLocalCart } = useCart();

  const handleBuyNow = () => {
    clearLocalCart();
    addItem({
      id: course.id,
      title: course.title,
      price: course.price,
      discountPrice: course.discountPrice,
      coverImage: course.coverImage,
      isFree: course.isFree,
      categoryName: course.category?.name,
    });
    navigate("/cart");
  };

  return (
    <div className="border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10 space-y-5 ">
      {/* Cover */}
      <div className="relative rounded-xl overflow-hidden shadow-md">
        <img
          src={course.coverImage}
          alt={course.title}
          className="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover"
        />

        {discountPercent > 0 && (
          <span className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 bg-red-500 text-white text-xs sm:text-sm font-semibold px-2 py-1 rounded-lg shadow">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-snug line-clamp-2">
        {course.title}
      </h2>

      {/* Rating */}
      <div className="flex items-center gap-1 text-sm sm:text-base">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars)
            return (
              <Star
                key={i}
                size={16}
                className="text-yellow-400 fill-yellow-400"
              />
            );
          if (i === fullStars && hasHalfStar)
            return <Star key={i} size={16} className="text-yellow-400" />;
          return <Star key={i} size={16} className="text-gray-300" />;
        })}
        <span className="text-gray-500 ml-1 text-xs sm:text-sm">
          {course.rating}/5
        </span>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed line-clamp-3">
        {course.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 pt-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <Layers size={16} className="text-indigo-500" />
          <span>{course.category?.name}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Users size={16} className="text-indigo-500" />
          <span>{course.instructor?.totalStudents || 0} HV</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Award size={16} className="text-indigo-500" />
          <span>Chứng nhận</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t pt-4" />

      {/* Price */}
      <div className="flex items-end gap-2">
        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-red-500">
          {formatPrice(course.discountPrice)}
        </span>
        {course.price > course.discountPrice && (
          <span className="line-through text-xs sm:text-sm md:text-base text-gray-400">
            {formatPrice(course.price)}
          </span>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="space-y-2 sm:space-y-3">
        <button
          className="w-full bg-indigo-600 text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md flex items-center justify-center"
          onClick={handleBuyNow}
        >
          <CreditCard size={18} className="inline-block mr-2" />
          Mua ngay
        </button>

        <button
          onClick={() =>
            addItem({
              id: course.id,
              title: course.title,
              slug: course.slug,
              price: course.price,
              discountPrice: course.discountPrice,
              coverImage: course.coverImage,
              isFree: course.isFree,
              instructor: course.instructor,
            })
          }
          className="w-full border border-indigo-600 text-indigo-600 py-2.5 sm:py-3 rounded-xl font-medium hover:bg-indigo-50 transition flex items-center justify-center"
        >
          <ShoppingCart size={18} className="inline-block mr-2" />
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
};

export default CoursePurchaseBox;
