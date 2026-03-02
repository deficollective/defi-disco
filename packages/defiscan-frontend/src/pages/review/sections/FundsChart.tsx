import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatUsdValue } from '../../../utils/format'

interface FundsChartProps {
  data: { name: string; value: number }[]
}

const COLORS = [
  '#7C3AED',
  '#8B5CF6',
  '#A78BFA',
  '#C4B5FD',
  '#DDD6FE',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#6B7280',
]

export function FundsChart({ data }: FundsChartProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-medium text-text-primary mb-4">
        Fund Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={2}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            labelLine={true}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatUsdValue(value)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E1ED',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
