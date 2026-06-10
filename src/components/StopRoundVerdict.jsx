import { STATUS, STOP_REASON, fmtPct } from '../utils/formatters'

// THẺ "CHỮ KÝ" của hệ thống: đề xuất số lần kiểm cho 1 lô, kèm lý do GMP rõ ràng
// và dải tỷ lệ theo từng lần. Đây là nơi thể hiện rõ "AI/hệ thống hỗ trợ — QA quyết định".
export default function StopRoundVerdict({ stop, threshold }) {
  if (!stop) {
    return (
      <section className="card card-pad rise">
        <h3 className="card-title">Đề xuất số lần kiểm</h3>
        <p className="card-sub">Chọn một lô cụ thể để xem đề xuất dừng kiểm cho lô đó.</p>
      </section>
    )
  }

  const reason = STOP_REASON[stop.reason] || STOP_REASON.chua_du_co_so
  const s = STATUS[reason.status]
  const rates = stop.round_rates || []
  const maxRate = Math.max(0.001, ...rates.map((r) => Number(r.rate ?? 0)))
  const thr = Number(stop.threshold_pct ?? threshold ?? 0.1)

  return (
    <section className="card overflow-hidden rise">
      <div className="card-pad" style={{ background: s.bg, borderBottom: `1px solid ${s.border}` }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide" style={{ color: s.text }}>
              Đề xuất số lần kiểm · Lô {stop.lot_id}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              {stop.suggested_stop_round ? (
                <>
                  <span className="font-display text-4xl font-bold tnum" style={{ color: s.text }}>
                    {stop.suggested_stop_round}
                  </span>
                  <span className="text-sm" style={{ color: s.text }}>
                    lần là có thể cân nhắc dừng
                  </span>
                </>
              ) : (
                <span className="font-display text-2xl font-semibold" style={{ color: s.text }}>
                  Chưa đề xuất dừng
                </span>
              )}
            </div>
          </div>
          <span
            className="chip"
            style={{ color: s.text, background: '#fff', borderColor: s.border }}
          >
            {reason.title}
          </span>
        </div>
        <p className="mt-2 text-sm" style={{ color: s.text }}>
          {reason.desc}
        </p>
      </div>

      <div className="card-pad">
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>Tỷ lệ tạp toàn lô theo từng lần kiểm</span>
          <span className="tnum">Ngưỡng áp dụng: {fmtPct(thr)}</span>
        </div>
        <div className="flex items-end gap-1.5" style={{ height: 92 }}>
          {rates.map((r) => {
            const val = Number(r.rate ?? 0)
            const h = Math.max(3, (val / maxRate) * 78)
            const over = val > thr
            const isStop = r.round === stop.suggested_stop_round
            return (
              <div key={r.round} className="flex flex-1 flex-col items-center justify-end">
                <div
                  className="w-full rounded-t"
                  title={`Lần ${r.round}: ${fmtPct(val)}`}
                  style={{
                    height: h,
                    background: over ? STATUS.alert.dot : STATUS.good.dot,
                    outline: isStop ? `2px solid ${STATUS.good.text}` : 'none',
                    outlineOffset: 1,
                  }}
                />
                <span className={`mt-1 text-[10px] tnum ${isStop ? 'font-bold text-pine' : 'text-muted'}`}>
                  {r.round}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-3 rounded-lg bg-mint-50 px-3 py-2 text-xs text-pine">
          Hệ thống chỉ hỗ trợ phân tích. Quyết định dừng/giảm số lần kiểm do QA phê duyệt theo SOP và đánh giá rủi ro (QRM).
        </p>
      </div>
    </section>
  )
}
