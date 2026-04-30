import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight, LayoutList } from "lucide-react";

const PanelCard = ({
  title,
  subtitle,
  children,
  total = 0,
  defaultLimit = 4,
  icon: Icon,
}) => {
  const [expanded, setExpanded] = useState(false);

  const items = React.Children.toArray(children);
  const hasMore = items.length > defaultLimit;

  const visibleItems = useMemo(() => {
    return expanded ? items : items.slice(0, defaultLimit);
  }, [expanded, items, defaultLimit]);

  return (
    <section className="group rounded-3xl hover-bg-muted bg-card backdrop-blur-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* TOP BAR */}
      <div className="p-5 md:p-6 ">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {Icon && (
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon size={20} />
              </div>
            )}

            <div className="min-w-0">
              <h3 className="font-semibold text-base md:text-lg truncate">
                {title}
              </h3>

              <p className="text-xs text-muted-foreground mt-1">
                {subtitle || `${total} records available`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 h-9 rounded-xl bg-muted text-sm font-semibold flex items-center">
              {total}
            </span>

            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="h-9 px-3 rounded-xl  hover:bg-muted transition-all flex items-center gap-2 text-sm font-medium"
              >
                {expanded ? "Collapse" : "View all"}

                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      {items.length === 0 ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-center px-6">
          <div className="w-14 h-14 rounded-2xl  bg-muted flex items-center justify-center mb-4">
            <LayoutList size={20} />
          </div>

          <p className="font-medium">No data available</p>
          <p className="text-sm text-muted-foreground mt-1">
            New records will appear here automatically.
          </p>
        </div>
      ) : (
        <div
          className={`p-5 space-y-3 ${
            expanded ? "max-h-[600px] overflow-y-auto" : ""
          }`}
        >
          {visibleItems}
        </div>
      )}
    </section>
  );
};

export default PanelCard;
