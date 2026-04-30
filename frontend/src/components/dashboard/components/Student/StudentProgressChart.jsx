import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const StudentProgressChart = ({ data }) => {
  const chartData = data.map((c) => ({
    name: c.course.title,
    progress: Math.round(c.progress),
  }));

  return (
    <div className="bg-card p-6 rounded-xl border border-border">
      <h3 className="font-semibold text-lg mb-4">Course Progress</h3>

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground">No progress yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" />
            <Tooltip />
            <Bar dataKey="progress" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default StudentProgressChart;
