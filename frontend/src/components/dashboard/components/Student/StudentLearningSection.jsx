import PanelCard from "../PanelCard";
import {
  BookOpen,
  PlayCircle,
  Clock3,
  Trophy,
  Bookmark,
  ArrowUpRight,
} from "lucide-react";

const timeAgo = (date) => {
  if (!date) return "Never";

  const diff = Math.floor((Date.now() - new Date(date)) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const rowClass =
  "group rounded-2xl border border-border/50 p-4 hover:bg-muted/60 hover:shadow-sm transition-all duration-200";

const StudentLearningSection = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      {/* CONTINUE LEARNING */}
      <PanelCard
        title="Continue Learning"
        subtitle="Resume your recent courses"
        total={data.continueLearning?.length}
        icon={PlayCircle}
      >
        {data.continueLearning?.map((item) => (
          <div key={item._id} className={rowClass}>
            <div className="flex gap-4">
              <img
                src={item.course?.coverImage}
                alt={item.course?.title}
                className="w-16 h-16 rounded-2xl object-cover shrink-0"
              />

              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{item.course?.title}</p>

                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${item.progress || 0}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{item.progress || 0}% complete</span>
                  <span>{timeAgo(item.lastAccessed)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </PanelCard>

      {/* QUIZZES */}
      <PanelCard
        title="Available Quizzes"
        subtitle="Improve your score"
        total={data.quizzes?.length}
        icon={Trophy}
      >
        {data.quizzes?.map((quiz) => (
          <div key={quiz._id} className={rowClass}>
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{quiz.title}</p>

                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {quiz.scope} • {quiz.type}
                </p>

                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock3 size={13} />
                  {quiz.timeLimit} mins
                </div>
              </div>

              <ArrowUpRight size={16} className="opacity-40 shrink-0" />
            </div>
          </div>
        ))}
      </PanelCard>

      {/* BOOKMARKS */}
      <PanelCard
        title="Bookmarks"
        subtitle="Saved for later"
        total={data.bookmarks?.length}
        icon={Bookmark}
      >
        {data.bookmarks?.map((item) => (
          <div key={item._id} className={rowClass}>
            <div className="flex gap-4">
              <img
                src={item.course?.coverImage}
                alt={item.course?.title}
                className="w-14 h-14 rounded-2xl object-cover shrink-0"
              />

              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{item.course?.title}</p>

                <p className="text-xs text-muted-foreground mt-2">
                  Saved {timeAgo(item.addedAt)}
                </p>
              </div>

              <ArrowUpRight size={16} className="opacity-40 shrink-0" />
            </div>
          </div>
        ))}
      </PanelCard>
    </div>
  );
};

export default StudentLearningSection;
