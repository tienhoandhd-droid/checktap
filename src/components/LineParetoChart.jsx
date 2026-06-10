import { ChartCard } from './StateBlocks'
import { fmtInt } from '../utils/formatters'

// Pareto theo dây chuyền/công đoạn. Dữ liệu hiện tại có thể chưa ghi dây chuyền
// (sẽ hiện "(không rõ)") — component nêu rõ điều đó thay vì để trống khó hiểu.
export default function LineParetoChart({ data }) {
  const rows = [...(data || [])]
    .filter((r) => Number(r.impurity_qty) > 0)
    .sort((a, b) => Number(b.impurity_qty) - Number(a.impurity_qty))

  const total = rows.reduce((s, r) => s + Number(r.impurity_qty), 0) || 1
  const onlyUnknown =
    rows.length > 0 && rows.every((r) => /không rõ/i.test(r.line_id) && /không rõ/i.test(r.process_stage))

  return (
    <ChartCard
      title="Pareto theo dây chuyền / công đoạn"
      sub="Đóng góp tạp theo dây chuyền và công đoạn (nếu dữ liệu có ghi)."
      isEmpty={rows.length === 0}
      emptyHint="Không có tạp trong phạm vi đã chọn."
    >
      {onlyUnknown ? (
        <div className="rounded-lg bg-mint-50/70 px-3 py-3 text-sm text-muted">
          Dữ liệu hiện chưa ghi <b>dây chuyền</b> / <b>công đoạn</b>. Bổ sung 2 cột này trong phiếu nhập liệu để
          bật phân tích theo dây chuyền.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const pct = (Number(r.impurity_qty) / total) * 100
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-40 shrink-0 truncate text-xs text-body" title={`${r.line_id} · ${r.process_stage}`}>
                  {r.line_id}
                  <span className="text-muted"> · {r.process_stage}</span>
                </div>
                <div className="h-5 flex-1 overflow-hidden rounded bg-mint-50">
                  <div
                    className="h-full rounded"
                    style={{ width: `${Math.max(2, pct)}%`, background: i === 0 ? '#C0563F' : i < 3 ? '#E6B26A' : '#2E8B74' }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-xs tnum text-body">
                  {fmtInt(r.impurity_qty)} · {pct.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ChartCard>
  )
}
