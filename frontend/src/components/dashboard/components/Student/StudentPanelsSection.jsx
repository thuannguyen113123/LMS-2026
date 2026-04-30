import PanelCard from "../PanelCard";
import { Bell, MessageCircle, Clock3, ArrowUpRight } from "lucide-react";

const timeAgo = (date) => {
  if (!date) return "Just now";

  const diff = Math.floor((Date.now() - new Date(date)) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const rowClass =
  "group rounded-2xl border border-border/50 p-4 hover:bg-muted/60 hover:shadow-sm transition-all duration-200";

const StudentPanelsSection = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      {/* NOTIFICATIONS */}
      <PanelCard
        title="Notifications"
        subtitle="Recent account activity"
        total={data.notifications?.length}
        icon={Bell}
      >
        {data.notifications?.map((item) => (
          <div key={item._id} className={rowClass}>
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">Room #{item.roomId?.slice(-6)}</p>

                <p className="text-xs text-muted-foreground mt-1">
                  {item.unreadCount > 0
                    ? `${item.unreadCount} unread messages`
                    : "All caught up"}
                </p>
              </div>

              <span className="text-xs text-muted-foreground shrink-0">
                {timeAgo(item.updatedAt)}
              </span>
            </div>
          </div>
        ))}
      </PanelCard>

      {/* COMMENTS */}
      <PanelCard
        title="Recent Comments"
        subtitle="Your latest discussions"
        total={data.comments?.length}
        icon={MessageCircle}
      >
        {data.comments?.map((item) => (
          <div key={item._id} className={rowClass}>
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold capitalize">{item.targetType}</p>

                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {item.content}
                </p>

                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock3 size={13} />
                  {timeAgo(item.createdAt)}
                </div>
              </div>

              <ArrowUpRight size={16} className="opacity-40 shrink-0" />
            </div>
          </div>
        ))}
      </PanelCard>
    </div>
  );
};

export default StudentPanelsSection;
