import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { ChartCard } from './StateBlocks'
import { fmtPct, fmtInt, rateStatus, STATUS } from '../utils/formatters'

// Tỷ lệ phát hiện theo người kiểm — GÓC NHÌN NHẤT QUÁN (Data Integrity), KHÔNG phải chấm điểm.
// Người có tỷ lệ cao chưa chắc quy trình xấu: có thể họ phát hiện tốt hơn. Chỉ để soi
// sự bất nhất bất thường giữa các người trên cùng dải sản phẩm.
export default function InspectorConsistencyPanel({ data, threshold, warning, max = 14 }) {
  const all = (data || [])
    .map((r) => ({
      inspector: r.inspector || '(không rõ)',
      rate: Number(r.rate ?? 0),
      checked: Number(r.checked_qty || 0),
      impurity: Number(r.impurity_qty || 0),
      n: Number(r.n_checks || 0),
    }))
    .filter((r) => r.checked > 0)
    .sort((a, b) => b.rate - a.rate)
  const rows = all.slice(0, max)
  const height = Math.max(160, rows.length * 26 + 40)

  return (
    <ChartCard
      title="Tỷ lệ phát hiện tạp theo người kiểm"
      sub="Góc nhìn nhất quán (Data Integrity), KHÔNG dùng để chấm điểm: tỷ lệ cao có thể do người đó phát hiện tốt hơn. Chú ý các giá trị lệch bất thường so với phần còn lại."
      isEmpty={rows.length === 0}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EFEA" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#5E7268' }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="inspector" tick={{ fontSize: 12, fill: '#384a44' }} width={120} interval={0} />
            <Tooltip
              formatter={(v, n, p) => {
                const d = p.payload
                return [`${fmtPct(d.rate)} · tạp ${fmtInt(d.impurity)}/${fmtInt(d.checked)} · ${fmtInt(d.n)} lần`, 'Phát hiện']
              }}
              contentStyle={{ borderRadius: 10, border: '1px solid #DCE9E4', fontSize: 12 }}
            />
            {warning != null && <ReferenceLine x={Number(warning)} stroke={STATUS.warn.dot} strokeDasharray="2 4" />}
            {threshold != null && <ReferenceLine x={Number(threshold)} stroke={STATUS.alert.dot} strokeDasharray="5 4" />}
            <Bar dataKey="rate" radius={[0, 3, 3, 0]} maxBarSize={18} isAnimationActive={false}
              label={{ position: 'right', fontSize: 11, fill: '#5E7268', formatter: (v) => fmtPct(v) }}>
              {rows.map((r, i) => (
                <Cell key={i} fill={rateStatus(r.rate, threshold, warning).dot} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {all.length > rows.length && (
        <p className="mt-2 text-xs text-muted">Hiển thị {rows.length}/{all.length} người (theo tỷ lệ cao nhất).</p>
      )}
    </ChartCard>
  )
}
