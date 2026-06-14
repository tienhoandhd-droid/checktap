import { useState } from 'react'
import { STATUS } from '../utils/formatters'

export function Loading({ label = 'Đang tải dữ liệu…' }) {
  return (
    <div className="card card-pad">
      <div className="flex items-center gap-3 text-muted">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-mint-100 border-t-teal" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3 rounded bg-mint-50" style={{ width: `${90 - i * 18}%` }} />
        ))}
      </div>
    </div>
  )
}

export function ErrorBlock({ error, onRetry }) {
  const msg = error?.message || String(error || 'Đã xảy ra lỗi không xác định.')
  return (
    <div className="card card-pad border-alert/30">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FaEbe7] text-alert">!</span>
        <div className="flex-1">
          <div className="card-title text-alert">Không tải được dữ liệu</div>
          <p className="mt-1 text-sm text-body">{msg}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-pine hover:bg-mint-50"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function Empty({ title = 'Chưa có dữ liệu', hint }) {
  return (
    <div className="card card-pad">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-mint-50 text-teal">∅</div>
        <div className="card-title">{title}</div>
        {hint && <p className="card-sub max-w-sm">{hint}</p>}
      </div>
    </div>
  )
}

export function StatusChip({ status, children }) {
  const s = STATUS[status] || STATUS.neutral
  return (
    <span className="chip" style={{ color: s.text, background: s.bg, borderColor: s.border }}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.dot }} />
      {children || s.label}
    </span>
  )
}

// Khung thẻ biểu đồ + xử lý rỗng tại chỗ (không vỡ khi data = [])
export function ChartCard({ title, sub, children, isEmpty, emptyHint, right, collapsible, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="card card-pad rise">
      <div className={`flex items-start justify-between gap-3 ${collapsible && !open ? '' : 'mb-3'}`}>
        <div>
          <h3 className="card-title">{title}</h3>
          {sub && (!collapsible || open) && <p className="card-sub">{sub}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          {collapsible && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="chip border-line text-muted hover:text-ink"
              aria-expanded={open}
            >
              {open ? 'Thu gọn ▴' : 'Mở ▾'}
            </button>
          )}
        </div>
      </div>
      {collapsible && !open ? null : isEmpty ? (
        <div className="flex h-[220px] items-center justify-center rounded-lg bg-mint-50/60 text-sm text-muted">
          {emptyHint || 'Không có dữ liệu trong phạm vi đã chọn.'}
        </div>
      ) : (
        children
      )}
    </section>
  )
}
