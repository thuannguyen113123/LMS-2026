import RevenueChart from "./components/RevenueChart";
import UserGrowthChart from "./components/UserGrowthChart";
import TopCoursesChart from "./components/TopCoursesChart";

const ChartsSection = ({ data }) => {
  if (!data) {
    return (
      <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[300px] bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <RevenueChart data={data.revenueTrend || []} />
      <UserGrowthChart data={data.userGrowth || []} />
      <TopCoursesChart data={data.topCourses || []} />
    </div>
  );
};

export default ChartsSection;
