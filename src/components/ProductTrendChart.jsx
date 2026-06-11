import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { ChartCard } from './StateBlocks'
import { fmtPct, fmtDate, STATUS } from '../utils/formatters'

const PALETTE = ['#1F5C4D', '#B9842B', '#3E6F8E', '#C0563F', '#8E6FB8', '#2E8B74']

// Xu hướng theo sản phẩm: mỗi điểm là 1 lô (tỷ lệ tạp toàn lô) theo thời gian.
export default function ProductTrendChart({ data, threshold }) {
  const rows = [...(data || [])].sort((a, b) => String(a.lot_date).localeCompare(String(b.lot_date)))
  const products = [...new Set(rows.map((r) => r.product_code))]

  // trục x theo lô (đảm bảo thứ tự thời gian); gắn nhãn ngày + lô
  const lots = []
  const seen = new Set()
  for (const r of rows) {
    if (!seen.has(r.lot_id)) { seen.add(r.lot_id); lots.push(r) }
  }
  const chart = lots.map((r) => {
    const row = { label: r.lot_id, date: r.lot_date }
    for (const p of products) {
      const hit = rows.find((x) => x.lot_id === r.lot_id && x.product_code === p)
      row[p] = hit ? Number(hit.lot_rate) : null
    }
    return row
  })

  return (
    <ChartCard
      title="Xu hướng tỷ lệ tạp theo sản phẩm (theo lô)"
      sub="Mỗi điểm là tỷ lệ tạp toàn lô, xếp theo thời gian. Giúp thấy lô nào cao bất thường."
      isEmpty={rows.length === 0}
    >
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart} margin={{ top: 8, right: 12, bottom: 28, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EFEA" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#5E7268' }} interval={0} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 12, fill: '#5E7268' }} tickFormatter={(v) => `${v}%`} width={48} />
            <Tooltip
              formatter={(v, n) => [v === null ? '—' : fmtPct(v), n]}
              labelFormatter={(l) => {
                const row = chart.find((c) => c.label === l)
                return `Lô ${l}${row?.date ? ` · ${fmtDate(row.date)}` : ''}`
              }}
              contentStyle={{ borderRadius: 10, border: '1px solid #DCE9E4', fontSize: 12 }}
            />
            {products.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            <ReferenceLine y={Number(threshold ?? 0.1)} stroke={STATUS.alert.dot} strokeDasharray="5 4" />
            {products.map((p, i) => (
              <Line key={p} type="monotone" dataKey={p} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
