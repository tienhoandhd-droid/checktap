import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { ChartCard } from './StateBlocks'
import { fmtPct, fmtInt, rateStatus, STATUS } from '../utils/formatters'

// Tỷ lệ tạp theo GIỜ bắt đầu kiểm (gần nhất với ý "khung giờ" — dữ liệu thật chỉ có 1 mốc giờ).
export default function HourOfDayChart({ data, threshold, warning }) {
  const rows = (data || [])
    .map((r) => ({
      hour: Number(r.hour),
      label: String(Number(r.hour)).padStart(2, '0') + 'h',
      rate: Number(r.rate ?? 0),
      checked: Number(r.checked_qty || 0),
      impurity: Number(r.impurity_qty || 0),
    }))
    .filter((r) => !Number.isNaN(r.hour))
    .sort((a, b) => a.hour - b.hour)

  return (
    <ChartCard
      title="Tỷ lệ tạp theo giờ bắt đầu kiểm"
      sub="Tỷ lệ = Σ tạp ÷ Σ kiểm theo giờ bắt đầu kiểm. Giúp soi ca/giờ nào tỷ lệ phát hiện lệch (lưu ý cỡ mẫu mỗi giờ khác nhau)."
      isEmpty={rows.length === 0}
    >
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EFEA" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5E7268' }} interval={0} />
            <YAxis tick={{ fontSize: 12, fill: '#5E7268' }} tickFormatter={(v) => `${v}%`} width={48} />
            <Tooltip
              formatter={(v, n, p) => {
                const d = p.payload
                return [`${fmtPct(d.rate)} · tạp ${fmtInt(d.impurity)}/${fmtInt(d.checked)}`, `Giờ ${d.label}`]
              }}
              labelFormatter={() => ''}
              contentStyle={{ borderRadius: 10, border: '1px solid #DCE9E4', fontSize: 12 }}
            />
            {warning != null && <ReferenceLine y={Number(warning)} stroke={STATUS.warn.dot} strokeDasharray="2 4" />}
            {threshold != null && <ReferenceLine y={Number(threshold)} stroke={STATUS.alert.dot} strokeDasharray="5 4" />}
            <Bar dataKey="rate" radius={[3, 3, 0, 0]} maxBarSize={34} isAnimationActive={false}>
              {rows.map((r, i) => (
                <Cell key={i} fill={rateStatus(r.rate, threshold, warning).dot} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
