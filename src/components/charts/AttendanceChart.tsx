import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AttendanceData {
  id: string;
  date: string;
  status: 'present' | 'absent';
}

interface AttendanceChartProps {
  data: AttendanceData[];
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  const attendanceSummary = data.reduce(
    (acc, record) => {
      if (record.status === 'present') {
        acc.present += 1;
      } else {
        acc.absent += 1;
      }
      return acc;
    },
    { present: 0, absent: 0 }
  );

  const chartData = [
    { name: 'Present', value: attendanceSummary.present, color: '#10b981' },
    { name: 'Absent', value: attendanceSummary.absent, color: '#ef4444' },
  ];

  const COLORS = ['#10b981', '#ef4444'];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No attendance data available
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => 
              `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}