import { useState } from 'react'
import { ChartCard } from './StateBlocks'
import { fmtPct, fmtDate, heatColor, textOn } from '../utils/formatters'

// Heatmap nhóm sản phẩm (dọc) × ngày kiểm (ngang). Phát hiện ngày/nhóm tăng tạp.
export default function ProductTimeHeatmap({ data }) {
  const [hover, setHover] = useState(null)
  const rows = (data || []).filter((r) => r.inspection_date) // bỏ dòng không có ngày
  const families = [...new Set(rows.map((r) => r.product_family))]
  const dates = [...new Set(rows.map((r) => String(r.inspection_date).slice(0, 10)))].sort()

  const cell = new Map()
  for (const r of rows) cell.set(`${r.product_family}|${String(r.inspection_date).slice(0, 10)}`, Number(r.rate))

  const cellW = 40
  return (
    <ChartCard
      title="Bản đồ nhiệt nhóm sản phẩm × ngày"
      sub="Tỷ lệ tạp theo từng ngày cho mỗi nhóm sản phẩm. (Bỏ qua bản ghi không có ngày.)"
      isEmpty={rows.length === 0}
      emptyHint="Không có dữ liệu có ngày kiểm trong phạm vi đã chọn."
    >
      <div className="overflow-auto">
        <div className="inline-block">
          <div className="flex">
            <div className="shrink-0" style={{ width: 150 }} />
            {dates.map((d) => (
              <div key={d} className="shrink-0 text-center text-[9px] text-muted" style={{ width: cellW }}>
                {fmtDate(d).slice(0, 5)}
              </div>
            ))}
          </div>
          {families.map((f) => (
            <div key={f} className="flex items-center">
              <div className="shrink-0 truncate pr-2 text-right text-[11px] text-body" style={{ width: 150 }} title={f}>
                {f}
              </div>
              {dates.map((d) => {
                const v = cell.get(`${f}|${d}`)
                const bg = v === undefined ? '#F6F9F8' : heatColor(v)
                return (
                  <div
                    key={d}
                    className="shrink-0 border border-white"
                    style={{ width: cellW, height: 26, background: bg, cursor: v === undefined ? 'default' : 'pointer' }}
                    onMouseEnter={() => v !== undefined && setHover({ f, d, v })}
                    onMouseLeave={() => setHover(null)}
                  >
                    {v !== undefined && v > 0 && (
                      <span className="flex h-full items-center justify-center text-[9px] tnum" style={{ color: textOn(bg) }}>
                        {v.toFixed(v < 1 ? 1 : 0)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      {hover && (
        <div className="mt-3 rounded-lg bg-mint-50 px-3 py-2 text-xs text-pine tnum">
          <b>{hover.f}</b> · {fmtDate(hover.d)}: {fmtPct(hover.v)}
        </div>
      )}
    </ChartCard>
  )
}
