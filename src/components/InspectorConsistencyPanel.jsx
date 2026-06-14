import { useState } from 'react'
import { ChartCard } from './StateBlocks'
import { fmtPct, fmtInt, rateStatus, STATUS } from '../utils/formatters'

// Tỷ lệ phát hiện tạp theo NGƯỜI KIỂM — góc nhìn nhất quán (Data Integrity), KHÔNG chấm điểm.
// Ghi rõ SỐ LƯỢT (khung giờ), SỐ KG, ĐƠN VỊ KIỂM, SỐ TẠP để đọc tỷ lệ đúng bối cảnh:
// người kiểm ít lượt thì tỷ lệ chỉ mang tính tham khảo (cỡ mẫu nhỏ).
export default function InspectorConsistencyPanel({ data, threshold, warning }) {
  const [sortBy, setSortBy] = useState('rate') // 'rate' = tỷ lệ (mặc định) | 'n' = số lượt

  const rows = (data || [])
    .map((r) => ({
      inspector: r.inspector || '(không rõ)',
      rate: Number(r.rate ?? 0),
      checked: Number(r.checked_qty || 0),
      impurity: Number(r.impurity_qty || 0),
      n: Number(r.n_checks || 0),
      nkg: Number(r.n_kg || 0),
    }))
    .filter((r) => r.checked > 0)
    .sort((a, b) => (sortBy === 'rate' ? b.rate - a.rate : b.n - a.n))

  if (!rows.length) {
    return (
      <ChartCard title="Tỷ lệ phát hiện tạp theo người kiểm" isEmpty />
    )
  }

  const maxRate = Math.max(...rows.map((r) => r.rate), Number(threshold) || 0, 0.0001)
  // "ít lượt" = ngưỡng cỡ mẫu nhỏ: < 30% trung vị số lượt (tối thiểu 3)
  const ns = rows.map((r) => r.n).sort((a, b) => a - b)
  const median = ns[Math.floor(ns.length / 2)] || 0
  const lowN = Math.max(3, Math.round(median * 0.3))

  const Th = ({ children, k, right }) => (
    <th
      className={`px-2 py-1.5 text-[11px] font-semibold text-muted ${right ? 'text-right' : 'text-left'} ${k ? 'cursor-pointer select-none hover:text-ink' : ''}`}
      onClick={k ? () => setSortBy(k) : undefined}
    >
      {children}{k && sortBy === k ? ' ↓' : ''}
    </th>
  )

  return (
    <ChartCard
      title="Tỷ lệ phát hiện tạp theo người kiểm"
      sub="Góc nhìn nhất quán (Data Integrity), KHÔNG chấm điểm. Tỷ lệ = Σ tạp ÷ Σ kiểm của người đó. Người kiểm ÍT lượt thì tỷ lệ chỉ tham khảo (cỡ mẫu nhỏ)."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              <Th>Người kiểm</Th>
              <Th k="n" right>Số lượt (khung giờ)</Th>
              <Th right>Số KG</Th>
              <Th right>Đơn vị kiểm</Th>
              <Th right>Số tạp</Th>
              <Th k="rate" right>Tỷ lệ phát hiện</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const st = rateStatus(r.rate, threshold, warning)
              const few = r.n < lowN
              return (
                <tr key={i} className="border-b border-line/60">
                  <td className="px-2 py-1.5 text-ink">
                    {r.inspector}
                    {few && (
                      <span className="ml-1.5 rounded bg-mint-50 px-1.5 py-0.5 text-[10px] text-muted" title="Ít lượt kiểm — tỷ lệ chỉ mang tính tham khảo">ít lượt</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right tnum font-medium">{fmtInt(r.n)}</td>
                  <td className="px-2 py-1.5 text-right tnum text-muted">{fmtInt(r.nkg)}</td>
                  <td className="px-2 py-1.5 text-right tnum text-muted">{fmtInt(r.checked)}</td>
                  <td className="px-2 py-1.5 text-right tnum">{fmtInt(r.impurity)}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-mint-50">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (r.rate / maxRate) * 100)}%`, background: st.dot, opacity: few ? 0.5 : 1 }} />
                      </div>
                      <span className="tnum font-semibold" style={{ color: st.dot, minWidth: 56, textAlign: 'right' }}>{fmtPct(r.rate)}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Sắp xếp mặc định theo <b>tỷ lệ cao → thấp</b>. Bấm tiêu đề “Tỷ lệ” hoặc “Số lượt” để đổi cách sắp xếp. Vạch ngưỡng áp dụng: {fmtPct(threshold)}.
        Người kiểm nhiều lượt mà tỷ lệ lệch hẳn so với phần còn lại mới là tín hiệu đáng soi.
      </p>
    </ChartCard>
  )
}
