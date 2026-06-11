import {
  ResponsiveContainer, ComposedChart, Bar, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { ChartCard } from './StateBlocks'
import { fmtPct, fmtInt, STATUS } from '../utils/formatters'

// Biểu đồ trả lời tiêu chí DỪNG KIỂM theo SOP:
//  - Cột = số tạp MỚI bắt được ở mỗi lần (nếu dừng ở lần n thì các cột sau là phần còn sót).
//  - Đường = % tích luỹ tạp đã phát hiện đến lần đó (tới ~100% và phẳng = gần như không còn bắt thêm).
//  - Cột tô ĐỎ = tạp tái xuất hiện (có tạp trở lại sau khi đã có lần sạch) → cảnh báo.
function buildSeries(data) {
  const rows = (data || [])
    .map((r) => ({ round: Number(r.check_round), nw: Number(r.impurity_qty || 0),
                   checked: Number(r.checked_qty || 0), rate: Number(r.rate ?? 0) }))
    .sort((a, b) => a.round - b.round)
  const total = rows.reduce((s, r) => s + r.nw, 0)
  let run = 0, hadImp = false, cleanAfterImp = false
  return {
    total,
    series: rows.map((r) => {
      run += r.nw
      const reappear = cleanAfterImp && r.nw > 0
      if (r.nw > 0) hadImp = true
      if (r.nw === 0 && hadImp) cleanAfterImp = true
      return {
        label: `Lần ${r.round}`,
        nw: r.nw,
        checked: r.checked,
        rate: r.rate,
        cumPct: total > 0 ? Number(((run / total) * 100).toFixed(1)) : 0,
        marginalPct: total > 0 ? Number(((r.nw / total) * 100).toFixed(1)) : 0,
        reappear,
      }
    }),
  }
}

function CumTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#fff', border: '1px solid #DCE9E4', borderRadius: 10, padding: '8px 10px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 2 }}>{d.label}</div>
      <div style={{ color: STATUS.warn.dot }}>Tích luỹ đã phát hiện: <b>{fmtPct(d.cumPct, 1)}</b></div>
      <div style={{ color: d.reappear ? STATUS.alert.dot : STATUS.good.dot }}>
        Tạp mới: <b>{fmtInt(d.nw)}</b>{d.reappear ? ' · tái xuất hiện' : ''} ({fmtPct(d.marginalPct, 1)} tổng)
      </div>
      <div style={{ color: '#5E7268' }}>Tỷ lệ lần này: {fmtPct(d.rate)} · kiểm {fmtInt(d.checked)}</div>
    </div>
  )
}

export default function CumulativeDetectionChart({ data, title, sub, unitLabel = 'tạp mới' }) {
  const { series, total } = buildSeries(data)
  const hasReappear = series.some((s) => s.reappear)
  return (
    <ChartCard
      title={title || 'Tạp mới theo lần & % tích luỹ đã phát hiện'}
      sub={sub || 'Cột = số tạp bắt được mỗi lần; đường = % tích luỹ. Đường tới ~100% và phẳng nghĩa là dừng ở lần đó còn sót rất ít; cột tăng sau khi đã phẳng = tạp tái xuất hiện.'}
      isEmpty={series.length === 0 || total === 0}
    >
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EFEA" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5E7268' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#5E7268' }} width={42}
              allowDecimals={false}
              label={{ value: `Số ${unitLabel}`, angle: -90, position: 'insideLeft', offset: 14, fontSize: 11, fill: '#5E7268' }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12, fill: '#5E7268' }}
              width={44} tickFormatter={(v) => `${v}%`}
              label={{ value: '% tích luỹ', angle: 90, position: 'insideRight', offset: 10, fontSize: 11, fill: '#5E7268' }} />
            <Tooltip content={<CumTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="nw" name={`Số ${unitLabel}`} radius={[3, 3, 0, 0]} maxBarSize={46} isAnimationActive={false}>
              {series.map((s, i) => (
                <Cell key={i} fill={s.reappear ? STATUS.alert.dot : STATUS.good.dot} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="cumPct" name="% tích luỹ đã phát hiện"
              stroke={STATUS.warn.dot} strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {hasReappear && (
        <p className="mt-2 text-xs" style={{ color: STATUS.alert.text }}>
          ⚠ Có lần tạp <b>tái xuất hiện</b> (cột đỏ): xu hướng giảm CHƯA hợp lệ — không nên dừng trước lần đó.
        </p>
      )}
    </ChartCard>
  )
}
