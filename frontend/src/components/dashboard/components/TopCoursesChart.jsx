import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

const TopCoursesChart = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.course.title,
    value: item.totalStudents,
  }));

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Top Courses</h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            outerRadius={90}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip />

          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) =>
              value.length > 20 ? value.slice(0, 20) + "..." : value
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopCoursesChart;
