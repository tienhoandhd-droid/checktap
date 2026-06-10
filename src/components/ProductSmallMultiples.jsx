import { ResponsiveContainer, BarChart, Bar, Cell, YAxis, Tooltip } from 'recharts'
import { ChartCard } from './StateBlocks'
import { fmtPct, rateStatus } from '../utils/formatters'

// "Small multiples": mỗi sản phẩm một ô nhỏ, cột = tỷ lệ tạp từng lô.
// Dễ so sánh nhanh nhiều sản phẩm cạnh nhau.
export default function ProductSmallMultiples({ data, threshold, warning }) {
  const rows = data || []
  const products = [...new Set(rows.map((r) => r.product_code))]

  return (
    <ChartCard
      title="So sánh nhanh giữa các sản phẩm"
      sub="Mỗi ô là một sản phẩm; mỗi cột là một lô (tỷ lệ tạp toàn lô)."
      isEmpty={rows.length === 0}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const lots = rows
            .filter((r) => r.product_code === p)
            .sort((a, b) => String(a.lot_date).localeCompare(String(b.lot_date)))
            .map((r) => ({ lot: r.lot_id, rate: Number(r.lot_rate ?? 0) }))
          const avg =
            lots.reduce((s, l) => s + l.rate, 0) / (lots.length || 1)
          const st = rateStatus(avg, threshold, warning)
          return (
            <div key={p} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <div className="font-display text-sm font-semibold text-ink">{p}</div>
                <span className="text-xs tnum" style={{ color: st.dot }}>{fmtPct(avg)}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted">{lots.length} lô</div>
              <div style={{ height: 70 }} className="mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lots} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <YAxis hide domain={[0, 'dataMax']} />
                    <Tooltip
                      formatter={(v) => [fmtPct(v), 'Tỷ lệ']}
                      labelFormatter={(_, pl) => `Lô ${pl?.[0]?.payload?.lot ?? ''}`}
                      contentStyle={{ borderRadius: 8, border: '1px solid #DCE9E4', fontSize: 11 }}
                    />
                    <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                      {lots.map((l, i) => (
                        <Cell key={i} fill={rateStatus(l.rate, threshold, warning).dot} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}
