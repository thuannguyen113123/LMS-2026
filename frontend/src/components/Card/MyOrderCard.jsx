import React from "react";

const statusMap = {
  paid: "bg-success-soft text-success",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-error/10 text-error",
};

const MyOrderCard = ({ order }) => {
  return (
    <div
      className="group bg-card border border-border rounded-2xl p-5 space-y-4 
                    hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg leading-snug line-clamp-2">
            {order.summary.title}
          </h3>

          <p className="text-xs text-muted-foreground mt-1">
            {order.summary.itemsCount} item
          </p>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded-md font-medium capitalize 
          ${statusMap[order.status]}`}
        >
          {order.status}
        </span>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-border" />

      {/* PRICE + META */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold tracking-tight">
            {order.pricing.formattedPrice}
          </p>
        </div>

        <div className="text-right text-xs text-muted-foreground space-y-1">
          <p>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
        </div>
      </div>
    </div>
  );
};

export default MyOrderCard;
