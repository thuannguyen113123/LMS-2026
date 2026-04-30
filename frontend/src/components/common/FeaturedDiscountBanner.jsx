import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaFire, FaClock, FaTicketAlt, FaUsers } from "react-icons/fa";

import { fetchFeaturedDiscount } from "../../features/discounts/discountThunks";
import {
  selectFeaturedDiscount,
  selectFeaturedDiscountLoading,
} from "../../features/discounts/discountSlice";

function getTimeLeft(endDate) {
  const total = new Date(endDate) - new Date();

  if (total <= 0) return null;

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export default function FeaturedDiscountHero() {
  const dispatch = useDispatch();
  const discount = useSelector(selectFeaturedDiscount);
  const loading = useSelector(selectFeaturedDiscountLoading);

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!discount) dispatch(fetchFeaturedDiscount());
  }, [dispatch, discount]);

  // ⏰ realtime countdown
  useEffect(() => {
    if (!discount?.validity?.endDate) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(discount.validity.endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [discount]);

  const displayValue = useMemo(() => {
    if (!discount) return "";
    return discount.type === "percentage"
      ? `${discount.value}%`
      : `${discount.value.toLocaleString()}đ`;
  }, [discount]);

  const usagePercent = useMemo(() => {
    if (!discount?.usage?.usageLimit) return 0;
    return (
      (discount.usage.usedCount / discount.usage.usageLimit) *
      100
    ).toFixed(0);
  }, [discount]);

  const handleCopy = () => {
    navigator.clipboard.writeText(discount.code);
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-card border border-border rounded-2xl p-10 animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-4" />
          <div className="h-6 w-40 bg-muted rounded mb-2" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </section>
    );
  }

  if (!discount) return null;

  return (
    <section className="relative px-4 mt-8">
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 sm:p-10 lg:p-14">
        {/* BACKGROUND LAYER */}
        <div className="bg-app-overlay" />
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-primary-soft rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary-soft rounded-full blur-2xl opacity-30" />

        <div className="relative z-10 space-y-10">
          {/* ================= HEADER ================= */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* LEFT */}
            <div className="space-y-5 max-w-2xl">
              {/* badge */}
              <div className="flex items-center gap-2 text-sm text-warning font-medium">
                <FaFire />
                Flash Sale • Hôm nay
              </div>

              {/* BIG TITLE */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                Giảm{" "}
                <span className="text-primary drop-shadow-sm">
                  {displayValue}
                </span>{" "}
                cho mọi khóa học
              </h1>

              {/* sub content */}
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                Tiết kiệm tối đa{" "}
                <b>{discount.conditions.maxDiscountAmount.toLocaleString()}đ</b>{" "}
                khi đăng ký hôm nay. Ưu đãi áp dụng cho tất cả khóa học chất
                lượng cao.
              </p>

              {/* CONDITIONS */}
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm opacity-80">
                <div className="px-3 py-1 rounded-lg bg-muted">
                  Đơn từ {discount.conditions.minOrderValue.toLocaleString()}đ
                </div>

                {discount.conditions.maxDiscountAmount > 0 && (
                  <div className="px-3 py-1 rounded-lg bg-muted">
                    Tối đa{" "}
                    {discount.conditions.maxDiscountAmount.toLocaleString()}đ
                  </div>
                )}
              </div>

              {/* CODE + CTA */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* code */}
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-sm font-semibold tracking-wide shadow-sm">
                  <FaTicketAlt />
                  {discount.code}
                </div>

                <button
                  onClick={handleCopy}
                  className="px-4 py-3 text-sm rounded-xl border border-border hover-bg-muted transition"
                >
                  Sao chép
                </button>
              </div>
            </div>

            {timeLeft && (
              <div className="grid grid-cols-4 gap-3 min-w-[280px]">
                {["days", "hours", "minutes", "seconds"].map((key) => (
                  <div
                    key={key}
                    className="bg-muted border border-border rounded-xl py-4 text-center shadow-sm"
                  >
                    <p className="text-2xl font-bold">{timeLeft[key]}</p>
                    <p className="text-xs opacity-60 uppercase tracking-wide">
                      {key}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* usage */}
            {discount.usage.usageLimit > 0 && (
              <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FaUsers />
                  Đã sử dụng
                </div>

                <p className="text-lg font-semibold">
                  {discount.usage.usedCount}/{discount.usage.usageLimit}
                </p>

                <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                <p className="text-xs opacity-60">
                  Còn {discount.usage.remaining} lượt
                </p>
              </div>
            )}

            {/* expiry */}
            <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FaClock />
                Thời gian
              </div>

              <p className="text-sm font-medium">
                Kết thúc:{" "}
                {new Date(discount.validity.endDate).toLocaleDateString()}
              </p>

              <p className="text-xs opacity-60">
                Áp dụng từ{" "}
                {new Date(discount.validity.startDate).toLocaleDateString()}
              </p>
            </div>

            {/* benefit */}
            <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">🎯 Lợi ích</div>

              <p className="text-sm font-medium">
                Tiết kiệm ngay {displayValue}
              </p>

              <p className="text-xs opacity-60">
                Áp dụng nhanh chóng, không giới hạn khóa học
              </p>
            </div>
          </div>
        </div>

        {/* hover glow */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition bg-primary-soft pointer-events-none" />
      </div>
    </section>
  );
}
