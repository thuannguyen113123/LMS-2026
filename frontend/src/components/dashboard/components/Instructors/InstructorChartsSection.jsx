import TopCoursesChart from "../TopCoursesChart";
import AnalyticsCard from "./AnalyticsCard";

const InstructorCharts = ({ data, analytics }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <TopCoursesChart data={data?.topCourses || []} />

      <AnalyticsCard analytics={analytics} />
    </div>
  );
};

export default InstructorCharts;
