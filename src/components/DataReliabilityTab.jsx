import { useEffect, useState } from 'react'
import { fetchReconciliation, fetchRiskSignals } from '../api/impurityApi'
import { fmtInt, fmtDate, STATUS } from '../utils/formatters'
import { Loading, ErrorBlock, Empty } from './StateBlocks'

function ReconciliationTable({ runs }) {
  if (!runs || runs.length === 0) return (
    <Empty title="Chưa có lịch sử import" hint="Chạy workflow n8n để nạp dữ liệu." />
  )
  // chỉ hiện run có dữ liệu (wf_valid > 0 hoặc errors_open > 0)
  const meaningful = runs.filter(r => r.wf_valid > 0 || r.errors_open > 0)
  if (meaningful.length === 0) return (
    <div className="text-sm text-muted">Có {runs.length} lần chạy nhưng tất cả đều rỗng (test).</div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted border-b border-line">
            <th className="pb-2 pr-2">Run ID</th>
            <th className="pb-2 pr-2 text-right">WF gửi</th>
            <th className="pb-2 pr-2 text-right">DB nhận</th>
            <th className="pb-2 pr-2 text-right">Chênh lệch</th>
            <th className="pb-2 pr-2 text-right">Lỗi mở</th>
            <th className="pb-2 pr-2 text-right">Đã xử lý</th>
            <th className="pb-2">Đánh giá</th>
          </tr>
        </thead>
        <tbody>
          {meaningful.map(r => {
            const ok = r.delta_valid === 0
            const hasOpen = r.errors_open > 0
            return (
              <tr key={r.run_id} className="border-b border-line/50">
                <td className="py-2 pr-2 text-xs text-muted font-mono">{r.run_id?.slice(0, 8)}…</td>
                <td className="py-2 pr-2 text-right tnum">{fmtInt(r.wf_valid)}</td>
                <td className="py-2 pr-2 text-right tnum">{fmtInt(r.db_rows)}</td>
                <td className="py-2 pr-2 text-right tnum">
                  <span style={{ color: ok ? STATUS.good.text : STATUS.alert.text, fontWeight: ok ? 400 : 600 }}>
                    {r.delta_valid === 0 ? '0 ✓' : r.delta_valid}
                  </span>
                </td>
                <td className="py-2 pr-2 text-right tnum">
                  {hasOpen ? <span style={{ color: STATUS.alert.text }}>{r.errors_open}</span> : '0'}
                </td>
                <td className="py-2 pr-2 text-right tnum">{fmtInt(r.errors_resolved || 0)}</td>
                <td className="py-2">
                  {ok && !hasOpen ? (
                    <span className="rounded-md px-2 py-0.5 text-xs" style={{ background: STATUS.good.bg, color: STATUS.good.text }}>Khớp</span>
                  ) : ok && hasOpen ? (
                    <span className="rounded-md px-2 py-0.5 text-xs" style={{ background: STATUS.warn.bg, color: STATUS.warn.text }}>Khớp, có lỗi chưa xử lý</span>
                  ) : (
                    <span className="rounded-md px-2 py-0.5 text-xs" style={{ background: STATUS.alert.bg, color: STATUS.alert.text }}>Lệch — cần kiểm tra</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function DataGapList({ gaps }) {
  if (!gaps || gaps.length === 0) return null
  return (
    <div className="space-y-2">
      {gaps.map((g, i) => (
        <div key={i} className="rounded-lg p-3 text-sm" style={{ background: STATUS.neutral.bg, borderLeft: `3px solid ${STATUS.neutral.border}` }}>
          <div className="font-medium text-ink">Lô {g.lot_id}</div>
          <div className="text-body">{g.suggested_action}</div>
          <div className="mt-1 text-xs text-muted">
            {g.evidence_json?.no_date > 0 && `${g.evidence_json.no_date}/${g.evidence_json.total} dòng thiếu ngày`}
            {g.evidence_json?.no_imp > 0 && ` · ${g.evidence_json.no_imp} dòng thiếu số tạp`}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DataReliabilityTab({ filters, dashDq }) {
  const [recon, setRecon] = useState(null)
  const [gaps, setGaps] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchReconciliation(),
      fetchRiskSignals({ lotId: filters.lotId, productCode: filters.productCode, lineId: filters.lineId }),
    ]).then(([reconRes, riskRes]) => {
      if (reconRes.error) setError(reconRes.error)
      else setRecon(reconRes.data)
      if (riskRes.data) setGaps(riskRes.data.filter(s => s.signal_type === 'data_quality_gap'))
      setLoading(false)
    })
  }, [filters.lotId, filters.productCode, filters.lineId])

  if (loading) return <Loading />
  if (error) return <ErrorBlock error={error} />

  // Data quality from main dashboard (if available)
  const dq = dashDq
  const totalErrors = dq ? Number(dq.error_rows_all || 0) : 0
  const scopeErrors = dq ? Number(dq.error_rows_in_scope || 0) : 0
  const noDate = dq ? Number(dq.rows_no_date || 0) : 0
  const noTime = dq ? Number(dq.rows_no_time || 0) : 0
  const total = dq ? Number(dq.rows_total || 0) : 0

  // Overall verdict
  const hasLeak = recon?.some(r => r.wf_valid > 0 && r.delta_valid !== 0)
  const hasOpenErrors = recon?.some(r => r.errors_open > 0)
  const hasGaps = gaps && gaps.length > 0

  let verdict, verdictStyle
  if (hasLeak) {
    verdict = 'Có chênh lệch import — dữ liệu chưa đáng tin để kết luận'
    verdictStyle = STATUS.alert
  } else if (hasOpenErrors || (hasGaps && gaps.some(g => g.evidence_json?.no_imp > 0))) {
    verdict = 'Dữ liệu cơ bản khớp nhưng có lỗi/thiếu — kết luận cần thận trọng'
    verdictStyle = STATUS.warn
  } else if (hasGaps) {
    verdict = 'Dữ liệu khớp; một số lô thiếu ngày nhưng không ảnh hưởng tính toán tỷ lệ'
    verdictStyle = STATUS.good
  } else {
    verdict = 'Dữ liệu đáng tin cậy — đủ cơ sở cho quyết định số lần kiểm'
    verdictStyle = STATUS.good
  }

  return (
    <div className="space-y-4">
      {/* Verdict banner */}
      <div className="card card-pad" style={{ background: verdictStyle.bg, borderColor: verdictStyle.border }}>
        <div className="text-sm font-medium" style={{ color: verdictStyle.text }}>{verdict}</div>
        {total > 0 && (
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-body">
            <span>Tổng bản ghi: <strong className="tnum">{fmtInt(total)}</strong></span>
            {noDate > 0 && <span>Thiếu ngày: <strong className="tnum">{fmtInt(noDate)}</strong></span>}
            {noTime > 0 && <span>Thiếu giờ: <strong className="tnum">{fmtInt(noTime)}</strong></span>}
            {totalErrors > 0 && <span>Dòng lỗi import: <strong className="tnum">{fmtInt(totalErrors)}</strong></span>}
          </div>
        )}
      </div>

      {/* Reconciliation table */}
      <div className="card card-pad">
        <div className="card-title mb-3">Đối chiếu import (Workflow vs DB)</div>
        <div className="card-sub mb-3">
          Mỗi lần workflow chạy, so "WF gửi" vs "DB nhận". Chênh lệch = 0 là khớp.
          Run cũ có delta {'>'} 0 do Upsert đổi run_id — không phải mất dữ liệu.
        </div>
        <ReconciliationTable runs={recon} />
      </div>

      {/* Data quality gaps */}
      {hasGaps && (
        <div className="card card-pad">
          <div className="card-title mb-3">Lô có dữ liệu thiếu — ảnh hưởng kết luận</div>
          <div className="card-sub mb-3">
            Nếu lô thiếu ngày nhưng đủ số kiểm/số tạp → tỷ lệ vẫn đúng, chỉ không lọc theo ngày được.
            Nếu thiếu số tạp → kết luận xu hướng có thể sai.
          </div>
          <DataGapList gaps={gaps} />
        </div>
      )}

      {/* Guidance */}
      <div className="card card-pad text-sm text-body">
        <div className="card-title mb-2">Khi nào đủ tin cậy để kết luận số lần kiểm?</div>
        <div className="space-y-1.5">
          <div>✓ Đối chiếu import: delta = 0 ở lần chạy gần nhất.</div>
          <div>✓ Không có dòng lỗi chưa xử lý (errors_open = 0) — hoặc đã xem xét và đánh dấu resolved/ignored.</div>
          <div>✓ Tab "Xu hướng kỹ thuật": sản phẩm có ≥ 5 lô và "đủ cơ sở thống kê".</div>
          <div>✓ Tab "Bản đồ rủi ro": không có risk HIGH nào chưa giải quyết.</div>
          <div>→ Khi tất cả đạt: có thể lấy số lần kiểm đề xuất từ tab chính (StopRoundVerdict) làm cơ sở cho SOP.</div>
        </div>
      </div>
    </div>
  )
}
