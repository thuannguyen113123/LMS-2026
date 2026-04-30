import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const UserGrowthChart = ({ data }) => {
  const chartData = data.map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    users: item.users,
  }));

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
      <h3 className="font-semibold text-lg mb-4">User Growth</h3>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          <XAxis dataKey="month" />

          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #eee",
            }}
          />

          <Bar
            dataKey="users"
            fill="#22c55e"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserGrowthChart;
