import { useState } from 'react'
import { ChartCard } from './StateBlocks'
import { fmtPct, fmtInt, heatColor, textOn } from '../utils/formatters'

// Heatmap KG (trục dọc) × Lần kiểm (trục ngang). Ô màu theo tỷ lệ tạp.
// Nếu nhiều lô, gộp theo (lô · KG) để không trộn KG khác lô.
export default function ImpurityHeatmap({ data, lotId }) {
  const [hover, setHover] = useState(null)
  const rows = (data || []).filter((r) => !lotId || r.lot_id === lotId)

  // gom theo KG (kèm lô khi xem nhiều lô)
  const multiLot = new Set(rows.map((r) => r.lot_id)).size > 1
  const keyOf = (r) => (multiLot ? `${r.lot_id} · ${r.kg_code}` : r.kg_code)

  const maxRound = rows.reduce((m, r) => Math.max(m, Number(r.check_round)), 0)
  const kgKeys = []
  const cellMap = new Map() // key|round -> {rate, checked, impurity}
  for (const r of rows) {
    const k = keyOf(r)
    if (!kgKeys.includes(k)) kgKeys.push(k)
    cellMap.set(`${k}|${r.check_round}`, {
      rate: r.rate === null ? null : Number(r.rate),
      checked: r.checked_qty,
      impurity: r.impurity_qty,
    })
  }
  // sắp xếp KG theo số thứ tự nếu có
  kgKeys.sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ''), 10)
    const nb = parseInt(String(b).replace(/\D/g, ''), 10)
    if (Number.isNaN(na) || Number.isNaN(nb)) return String(a).localeCompare(String(b))
    return na - nb
  })

  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1)
  const cellW = 38

  return (
    <ChartCard
      title="Bản đồ nhiệt theo khung kiểm (KG) × lần kiểm"
      sub="Mỗi ô là tỷ lệ tạp của một KG tại một lần kiểm. Màu đậm dần theo mức tạp."
      collapsible
      defaultOpen={false}
      isEmpty={rows.length === 0}
      right={
        <div className="flex items-center gap-1 text-[10px] text-muted no-print">
          <span>0%</span>
          <span className="h-2 w-24 rounded" style={{
            background: 'linear-gradient(90deg,#D7EAE2,#F2E6B0,#E6B26A,#C0563F)',
          }} />
          <span>cao</span>
        </div>
      }
    >
      <div className="overflow-auto">
        <div className="inline-block min-w-full">
          {/* header lần kiểm */}
          <div className="flex sticky top-0">
            <div className="shrink-0" style={{ width: 132 }} />
            {rounds.map((r) => (
              <div key={r} className="shrink-0 text-center text-[11px] font-medium text-muted" style={{ width: cellW }}>
                {r}
              </div>
            ))}
          </div>
          {kgKeys.map((k) => (
            <div key={k} className="flex items-center">
              <div className="shrink-0 truncate pr-2 text-right text-[11px] text-body" style={{ width: 132 }} title={k}>
                {k}
              </div>
              {rounds.map((r) => {
                const cell = cellMap.get(`${k}|${r}`)
                const bg = cell ? heatColor(cell.rate) : '#F6F9F8'
                const id = `${k}|${r}`
                return (
                  <div
                    key={r}
                    className="relative shrink-0 border border-white"
                    style={{ width: cellW, height: 26, background: bg, cursor: cell ? 'pointer' : 'default' }}
                    onMouseEnter={() => cell && setHover({ id, k, r, ...cell })}
                    onMouseLeave={() => setHover(null)}
                  >
                    {cell && cell.rate > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] tnum"
                        style={{ color: textOn(bg) }}>
                        {Number(cell.rate).toFixed(cell.rate < 1 ? 1 : 0)}
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
          <b>{hover.k}</b> · lần {hover.r}: {fmtInt(hover.impurity)}/{fmtInt(hover.checked)} = {fmtPct(hover.rate)}
        </div>
      )}
    </ChartCard>
  )
}
