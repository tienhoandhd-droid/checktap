import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { ChartCard } from './StateBlocks'
import { fmtInt, fmtPct } from '../utils/formatters'

// Pareto theo KG: cột = số đơn vị tạp của KG; đường = % luỹ kế.
// (Trong dữ liệu thực, KG đóng vai trò "khung/mẻ kiểm" thay cho khung giờ.)
export default function ParetoTimeBucketChart({ data, topN = 15 }) {
  const rows = [...(data || [])]
    .filter((r) => Number(r.impurity_qty) > 0)
    .sort((a, b) => Number(b.impurity_qty) - Number(a.impurity_qty))
    .slice(0, topN)

  let cum = 0
  const total = rows.reduce((s, r) => s + Number(r.impurity_qty), 0) || 1
  const chart = rows.map((r) => {
    cum += Number(r.impurity_qty)
    return {
      kg: r.kg_code,
      impurity: Number(r.impurity_qty),
      cum: Math.round((cum / total) * 1000) / 10,
    }
  })

  return (
    <ChartCard
      title="Pareto theo khung kiểm (KG)"
      sub={`Top ${topN} KG đóng góp nhiều tạp nhất, kèm % luỹ kế (quy tắc 80/20).`}
      isEmpty={chart.length === 0}
      emptyHint="Không có tạp trong phạm vi đã chọn."
    >
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chart} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EFEA" />
            <XAxis dataKey="kg" tick={{ fontSize: 10, fill: '#5E7268' }} interval={0} angle={-35} textAnchor="end" height={56} />
            <YAxis yAxisId="l" tick={{ fontSize: 12, fill: '#5E7268' }} width={42} />
            <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 12, fill: '#5E7268' }} tickFormatter={(v) => `${v}%`} width={42} />
            <Tooltip
              formatter={(v, n) => (n === 'cum' ? [`${v}%`, '% luỹ kế'] : [fmtInt(v), 'Đơn vị tạp'])}
              labelFormatter={(l) => `KG ${l}`}
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
