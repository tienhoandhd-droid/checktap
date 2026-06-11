import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { ChartCard } from './StateBlocks'
import { fmtInt } from '../utils/formatters'

// Pareto theo sản phẩm: sản phẩm nào đóng góp nhiều tạp nhất.
export default function ProductParetoChart({ data }) {
  const rows = [...(data || [])]
    .filter((r) => Number(r.impurity_qty) > 0)
    .sort((a, b) => Number(b.impurity_qty) - Number(a.impurity_qty))

  let cum = 0
  const total = rows.reduce((s, r) => s + Number(r.impurity_qty), 0) || 1
  const chart = rows.map((r) => {
    cum += Number(r.impurity_qty)
    return { name: r.product_code, impurity: Number(r.impurity_qty), cum: Math.round((cum / total) * 1000) / 10 }
  })

  return (
    <ChartCard
      title="Pareto theo sản phẩm"
      sub="Đóng góp tạp theo từng sản phẩm và % luỹ kế."
      isEmpty={chart.length === 0}
      emptyHint="Không có tạp trong phạm vi đã chọn."
    >
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chart} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EFEA" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5E7268' }} interval={0} angle={chart.length > 4 ? -25 : 0} textAnchor={chart.length > 4 ? 'end' : 'middle'} height={chart.length > 4 ? 48 : 24} />
            <YAxis yAxisId="l" tick={{ fontSize: 12, fill: '#5E7268' }} width={42} />
            <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: '#5E7268' }} width={42} />
            <Tooltip
              formatter={(v, n) => (n === 'cum' ? [`${v}%`, '% luỹ kế'] : [fmtInt(v), 'Đơn vị tạp'])}
              contentStyle={{ borderRadius: 10, border: '1px solid #DCE9E4', fontSize: 12 }}
            />
            <Bar yAxisId="l" dataKey="impurity" radius={[3, 3, 0, 0]}>
              {chart.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#C0563F' : i < 3 ? '#E6B26A' : '#2E8B74'} />
              ))}
            </Bar>
            <Line yAxisId="r" type="monotone" dataKey="cum" stroke="#1F5C4D" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
