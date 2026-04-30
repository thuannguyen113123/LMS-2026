import PanelCard from "./../PanelCard";
import { Users, BookOpen, MessageCircle, Clock3, Trophy } from "lucide-react";

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const statusColor = {
  completed: "bg-emerald-500/10 text-emerald-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  not_started: "bg-slate-500/10 text-slate-600",
};

const rowClass =
  "rounded-2xl border border-border/50 p-4 hover:bg-muted/60 transition-all";

const InstructorPanels = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid xl:grid-cols-3 gap-6">
      {/* ENROLLMENTS */}
      <PanelCard
        title="Recent Enrollments"
        subtitle="Latest student activities"
        total={data.enrollments?.length}
        icon={Users}
      >
        {data.enrollments?.map((item) => (
          <div key={item._id} className={rowClass}>
            <div className="flex justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">
                  Student #{item.student?._id?.slice(-5)}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Progress {item.progress?.percent || 0}%
                </p>

                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${item.progress?.percent || 0}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock3 size={12} />
                  {timeAgo(item.updatedAt)}
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium h-fit ${
                  statusColor[item.status]
                }`}
              >
                {item.status.replace("_", " ")}
              </span>
            </div>
          </div>
        ))}
      </PanelCard>

      {/* QUIZ */}
      <PanelCard
        title="Quiz Attempts"
        subtitle="Recent student submissions"
        total={data.quizAttempts?.length}
        icon={BookOpen}
      >
        {data.quizAttempts?.map((item) => (
          <div key={item._id} className={rowClass}>
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">
                  Student #{String(item.student).slice(-5)}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Attempts: {item.quiz?.attempts}/{item.quiz?.maxAttempts}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  {timeAgo(item.quiz?.lastSubmittedAt)}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
                  <Trophy size={14} />
                  {item.quiz?.score}/{item.quiz?.maxScore}
                </div>

                <p className="text-xs mt-2 text-emerald-600">
                  {item.quiz?.passed ? "Passed" : "Failed"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </PanelCard>

      {/* COMMENTS */}
      <PanelCard
        title="Recent Comments"
        subtitle="Newest course feedback"
        total={data.comments?.length}
        icon={MessageCircle}
      >
        {data.comments?.map((item) => (
          <div key={item._id} className={rowClass}>
            <p className="text-sm leading-relaxed line-clamp-2">
              {item.content}
            </p>

            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{timeAgo(item.createdAt)}</span>
              <span>{item.like_count || 0} likes</span>
            </div>
          </div>
        ))}
      </PanelCard>
    </div>
  );
};

export default InstructorPanels;
