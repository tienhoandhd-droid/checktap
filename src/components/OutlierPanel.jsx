import { fmtPct } from '../utils/formatters'

const GROUPS = {
  lot_high: { label: 'Lô cao bất thường', status: 'alert', icon: '▲' },
  reappearance: { label: 'Tạp tái xuất hiện', status: 'alert', icon: '↺' },
  kg_outlier: { label: 'Khung kiểm (KG) bất thường', status: 'warn', icon: '◆' },
}
const COLOR = {
  alert: { text: '#9c4030', bg: '#FaEbe7', border: '#E7C2B8' },
  warn: { text: '#8a6418', bg: '#FBF3E2', border: '#EAD7AC' },
}

export default function OutlierPanel({ data }) {
  const rows = data || []
  const order = ['lot_high', 'reappearance', 'kg_outlier']
  const grouped = order
    .map((sig) => ({ sig, items: rows.filter((r) => r.signal === sig) }))
    .filter((g) => g.items.length > 0)

  return (
    <section className="card card-pad rise">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="card-title">Tín hiệu bất thường cần chú ý</h3>
          <p className="card-sub">Phát hiện tự động theo quy tắc cố định — là gợi ý điều tra, không thay phán xét QA.</p>
        </div>
        <span className="chip border-line text-muted">{rows.length} tín hiệu</span>
      </div>

      {grouped.length === 0 ? (
        <div className="mt-3 rounded-lg bg-mint-50 px-3 py-3 text-sm text-pine">
          Không phát hiện tín hiệu bất thường trong phạm vi đã chọn.
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {grouped.map((g) => {
            const meta = GROUPS[g.sig]
            const c = COLOR[meta.status]
            return (
              <div key={g.sig}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded text-[11px]" style={{ color: c.text, background: c.bg }}>
                    {meta.icon}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: c.text }}>{meta.label}</span>
                  <span className="text-xs text-muted">({g.items.length})</span>
                </div>
                <ul className="space-y-1.5">
                  {g.items.slice(0, 12).map((it, i) => (
                    <li
                      key={i}
                      className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
                      style={{ color: c.text, background: c.bg, borderColor: c.border }}
                    >
                      <span className="font-semibold tnum">{it.lot_id}</span>
                      {it.kg_code ? <span className="tnum"> · {it.kg_code}</span> : null}
                      {it.check_round ? <span className="tnum"> · lần {it.check_round}</span> : null}
                      <span className="mx-1">—</span>
                      {it.note}
                    </li>
                  ))}
                  {g.items.length > 12 && (
                    <li className="px-1 text-[11px] text-muted">… và {g.items.length - 12} tín hiệu khác.</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
