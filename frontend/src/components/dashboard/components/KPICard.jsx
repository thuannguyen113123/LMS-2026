import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const formatNumber = (num) => new Intl.NumberFormat().format(num);

const KPICard = ({
  label,
  value = 0,
  currency = false,
  icon: Icon,
  color = "text-primary",
}) => {
  const numberRef = useRef(null);

  useEffect(() => {
    if (!numberRef.current) return;

    const obj = { val: 0 };

    gsap.to(obj, {
      val: value,
      duration: 1.4,
      ease: "power3.out",
      onUpdate: () => {
        if (!numberRef.current) return;

        const formatted = formatNumber(Math.floor(obj.val));
        numberRef.current.textContent = currency ? `$${formatted}` : formatted;
      },
    });
  }, [value, currency]);

  return (
    <div
      className="
      bg-card
      border border-border
      rounded-xl
      p-5
      flex
      items-center
      justify-between
      hover:shadow-lg
      transition
     hover:-translate-y-0.5
    "
    >
      <div>
        <p className="text-sm opacity-60">{label}</p>

        <h2 ref={numberRef} className="text-3xl font-semibold mt-1">
          {currency ? `$${formatNumber(value)}` : formatNumber(value)}
        </h2>
      </div>

      {Icon && (
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-lg bg-primary-soft ${color}`}
        >
          <Icon size={20} />
        </div>
      )}
    </div>
  );
};

export default KPICard;
