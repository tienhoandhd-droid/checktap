import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Legend,
} from 'recharts'
import { ChartCard } from './StateBlocks'
import { fmtPct, STATUS } from '../utils/formatters'

const PALETTE = ['#1F5C4D', '#2E8B74', '#6FBFA6', '#B9842B', '#C0563F', '#3E6F8E', '#8E6FB8', '#5E7268']

export default function LotRoundTrendChart({ data, threshold, warning }) {
  const rows = data || []
  const lots = [...new Set(rows.map((r) => r.lot_id))]
  const maxRound = rows.reduce((m, r) => Math.max(m, Number(r.check_round)), 0)

  // pivot: [{ round: 1, 'PL07/0126': 0.57, ... }, ...]
  const byRound = []
  for (let r = 1; r <= maxRound; r++) {
    const row = { round: r }
    for (const lot of lots) {
      const hit = rows.find((x) => x.lot_id === lot && Number(x.check_round) === r)
      row[lot] = hit ? Number(hit.rate) : null
    }
    byRound.push(row)
  }

  return (
    <ChartCard
      title="Xu hướng tỷ lệ tạp theo lần kiểm"
      sub="Tỷ lệ = Σ tạp ÷ Σ kiểm của lô tại mỗi lần. Đường nét đứt là ngưỡng áp dụng."
      isEmpty={rows.length === 0}
    >
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={byRound} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EFEA" />
            <XAxis
              dataKey="round"
              tick={{ fontSize: 12, fill: '#5E7268' }}
              label={{ value: 'Lần kiểm', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#5E7268' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#5E7268' }} tickFormatter={(v) => `${v}%`} width={48} />
            <Tooltip
              formatter={(v, n) => [v === null ? '—' : fmtPct(v), n]}
              labelFormatter={(l) => `Lần kiểm ${l}`}
              contentStyle={{ borderRadius: 10, border: '1px solid #DCE9E4', fontSize: 12 }}
            />
            {lots.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {warning != null && (
              <ReferenceLine
                y={Number(warning)}
                stroke={STATUS.warn.dot}
                strokeDasharray="2 4"
                label={{ value: `Cảnh báo ${fmtPct(warning)}`, position: 'right', fontSize: 10, fill: STATUS.warn.dot }}
              />
            )}
            <ReferenceLine
              y={Number(threshold ?? 0.1)}
              stroke={STATUS.alert.dot}
              strokeDasharray="5 4"
              label={{ value: `Ngưỡng ${fmtPct(threshold)}`, position: 'right', fontSize: 10, fill: STATUS.alert.dot }}
            />
            {lots.map((lot, i) => (
              <Line
                key={lot}
                type="monotone"
                dataKey={lot}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 2.5 }}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
