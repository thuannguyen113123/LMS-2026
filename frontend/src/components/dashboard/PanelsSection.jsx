import PanelCard from "./components/PanelCard";
import {
  ShieldCheck,
  MessageCircle,
  ShoppingCart,
  Users,
  Clock3,
  ArrowUpRight,
} from "lucide-react";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const formatDate = (date) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const badgeColor = {
  paid: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const rowClass =
  "group rounded-2xl border border-border/50 p-4 hover:bg-muted/60 hover:shadow-sm transition-all duration-200";

const PanelsSection = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      {/* ORDERS */}
      <PanelCard
        title="Recent Orders"
        subtitle="Latest completed transactions"
        total={data.recentOrders?.length}
        icon={ShoppingCart}
      >
        {data.recentOrders?.map((order) => (
          <div key={order._id} className={rowClass}>
            <div className="flex justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {order.userId?.fullname}
                </p>

                <p className="text-sm text-muted-foreground truncate mt-1">
                  {order.items?.[0]?.title}
                </p>

                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock3 size={13} />
                  {timeAgo(order.createdAt)}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-semibold">
                  {formatCurrency(order.finalAmount)}
                </p>

                <span
                  className={`mt-2 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    badgeColor[order.status]
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </PanelCard>

      {/* USERS */}
      <PanelCard
        title="Recent Users"
        subtitle="Newest joined members"
        total={data.recentUsers?.length}
        icon={Users}
      >
        {data.recentUsers?.map((user) => (
          <div key={user._id} className={rowClass}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
                {user.fullname?.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{user.fullname}</p>

                <p className="text-xs text-muted-foreground mt-1">
                  Joined {formatDate(user.createdAt)}
                </p>
              </div>

              <ArrowUpRight size={16} className="opacity-40" />
            </div>
          </div>
        ))}
      </PanelCard>

      {/* AUDIT */}
      <PanelCard
        title="Audit Logs"
        subtitle="Latest system modifications"
        total={data.auditLogs?.length}
        icon={ShieldCheck}
      >
        {data.auditLogs?.map((log) => (
          <div key={log._id} className={rowClass}>
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold text-sm capitalize">
                  {log.entityType.replaceAll("_", " ")}
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  Updated <span className="font-medium">{log.field}</span>
                </p>
              </div>

              <span className="text-xs text-muted-foreground shrink-0">
                {timeAgo(log.updatedAt)}
              </span>
            </div>
          </div>
        ))}
      </PanelCard>

      {/* CHATS */}
      <PanelCard
        title="Active Chats"
        subtitle="Currently active conversations"
        total={data.activeChats?.length}
        icon={MessageCircle}
      >
        {data.activeChats?.map((chat) => (
          <div key={chat._id} className={rowClass}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MessageCircle size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{chat.name}</p>

                <p className="text-xs text-muted-foreground mt-1">
                  {chat.type} • {chat.user_ids?.length} members
                </p>
              </div>

              <span className="text-xs text-muted-foreground">
                {timeAgo(chat.updated_at)}
              </span>
            </div>
          </div>
        ))}
      </PanelCard>
    </div>
  );
};

export default PanelsSection;
