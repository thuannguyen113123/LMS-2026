import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const RevenueChart = ({ data }) => {
  const chartData = data.map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    revenue: item.revenue,
  }));

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Revenue Trend</h3>
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground">No revenue data</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

            <XAxis dataKey="month" />

            <YAxis tickFormatter={(v) => `${v / 1000}k`} />

            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #eee",
              }}
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RevenueChart;
