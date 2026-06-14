import { useEffect, useState } from 'react'
import { fetchRiskSignals } from '../api/impurityApi'
import { fmtPct, STATUS } from '../utils/formatters'
import { Loading, ErrorBlock, Empty } from './StateBlocks'

const SIGNAL_LABELS = {
  reappearance: { vi: 'Tạp tái xuất hiện', icon: '🔁' },
  lot_abnormally_high: { vi: 'Lô cao bất thường', icon: '📈' },
  kg_exceeds_threshold: { vi: 'KG vượt ngưỡng', icon: '🔴' },
  trend_increasing: { vi: 'Xu hướng tăng (MA3)', icon: '📊' },
  kg_pareto_dominant: { vi: 'KG chiếm Pareto cao', icon: '🏗️' },
  inspector_deviation: { vi: 'Người kiểm lệch', icon: '👤' },
  hour_deviation: { vi: 'Giờ bất thường', icon: '🕐' },
  data_quality_gap: { vi: 'Thiếu dữ liệu', icon: '⚠️' },
}

const RISK_STYLE = {
  high: { bg: STATUS.alert.bg, border: STATUS.alert.border, text: STATUS.alert.text, label: 'Cao' },
  medium: { bg: STATUS.warn.bg, border: STATUS.warn.border, text: STATUS.warn.text, label: 'Trung bình' },
  low: { bg: STATUS.neutral.bg, border: STATUS.neutral.border, text: STATUS.neutral.text, label: 'Thấp' },
}

function SignalCard({ s }) {
  const style = RISK_STYLE[s.risk_level] || RISK_STYLE.low
  const label = SIGNAL_LABELS[s.signal_type] || { vi: s.signal_type, icon: '❓' }
  return (
    <div className="rounded-lg p-3 text-sm" style={{ background: style.bg, borderLeft: `3px solid ${style.border}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium" style={{ color: style.text }}>
            {label.icon} {label.vi}
            {s.lot_id && <span className="ml-2 font-normal text-body">Lô {s.lot_id}</span>}
            {s.kg_code && <span className="text-muted"> · {s.kg_code}</span>}
            {s.check_round && <span className="text-muted"> · Lần {s.check_round}</span>}
          </div>
          <div className="mt-1 text-body">{s.suggested_action}</div>
          {s.product_code && (
            <div className="mt-1 text-xs text-muted">
              {s.product_code}{s.line_id ? ` · ${s.line_id}` : ''}
            </div>
          )}
        </div>
        <div className="shrink-0 rounded px-2 py-0.5 text-xs font-medium"
             style={{ background: style.border, color: style.text }}>
          {style.label} ({s.risk_score})
        </div>
      </div>
    </div>
  )
}

export default function RiskMapTab({ filters }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetchRiskSignals({
      lotId: filters.lotId,
      productCode: filters.productCode,
      lineId: filters.lineId,
    }).then(({ data: d, error: e }) => {
      if (e) setError(e); else setData(d)
      setLoading(false)
    })
  }, [filters.lotId, filters.productCode, filters.lineId])

  if (loading) return <Loading />
  if (error) return <ErrorBlock error={error} />
  if (!data || data.length === 0) return (
    <Empty title="Không có tín hiệu rủi ro" hint="Dữ liệu trong phạm vi đang chọn không phát hiện bất thường — tốt cho việc đề xuất giảm số lần kiểm." />
  )

  const types = [...new Set(data.map(s => s.signal_type))]
  const filtered = typeFilter === 'all' ? data : data.filter(s => s.signal_type === typeFilter)
  const high = filtered.filter(s => s.risk_level === 'high')
  const medium = filtered.filter(s => s.risk_level === 'medium')
  const low = filtered.filter(s => s.risk_level === 'low')

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="card card-pad">
        <div className="card-title mb-3">Tổng quan rủi ro — ảnh hưởng quyết định số lần kiểm</div>
        <div className="flex flex-wrap gap-3 text-sm">
          {high.length > 0 && (
            <span className="rounded-lg px-3 py-1.5 font-medium" style={{ background: STATUS.alert.bg, color: STATUS.alert.text }}>
              {high.length} rủi ro CAO — chưa nên giảm kiểm
            </span>
          )}
          {medium.length > 0 && (
            <span className="rounded-lg px-3 py-1.5 font-medium" style={{ background: STATUS.warn.bg, color: STATUS.warn.text }}>
              {medium.length} cần theo dõi
            </span>
          )}
          {low.length > 0 && (
            <span className="rounded-lg px-3 py-1.5" style={{ background: STATUS.neutral.bg, color: STATUS.neutral.text }}>
              {low.length} lưu ý
            </span>
          )}
          {high.length === 0 && medium.length === 0 && (
            <span className="rounded-lg px-3 py-1.5 font-medium" style={{ background: STATUS.good.bg, color: STATUS.good.text }}>
              Không có rủi ro cao/trung bình — có thể xem xét giảm số lần kiểm
            </span>
          )}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 text-xs no-print">
        <button onClick={() => setTypeFilter('all')}
                className={`rounded-lg px-3 py-1.5 border ${typeFilter === 'all' ? 'bg-ink text-white border-ink' : 'border-line text-body hover:bg-page'}`}>
          Tất cả ({data.length})
        </button>
        {types.map(t => {
          const label = SIGNAL_LABELS[t] || { vi: t, icon: '' }
          const count = data.filter(s => s.signal_type === t).length
          return (
            <button key={t} onClick={() => setTypeFilter(t)}
                    className={`rounded-lg px-3 py-1.5 border ${typeFilter === t ? 'bg-ink text-white border-ink' : 'border-line text-body hover:bg-page'}`}>
              {label.icon} {label.vi} ({count})
            </button>
          )
        })}
      </div>

      {/* Signal list by severity */}
      {high.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: STATUS.alert.text }}>Rủi ro cao ({high.length})</div>
          {high.map((s, i) => <SignalCard key={`h-${i}`} s={s} />)}
        </div>
      )}
      {medium.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: STATUS.warn.text }}>Cần theo dõi ({medium.length})</div>
          {medium.map((s, i) => <SignalCard key={`m-${i}`} s={s} />)}
        </div>
      )}
      {low.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Lưu ý ({low.length})</div>
          {low.map((s, i) => <SignalCard key={`l-${i}`} s={s} />)}
        </div>
      )}
    </div>
  )
}
