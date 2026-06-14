import { useState } from 'react'
import { fmtDate, fmtPct, STATUS } from '../utils/formatters'
import { StatusChip } from './StateBlocks'

// Ánh xạ trạng thái AI -> trạng thái màu của app
const STATUS_MAP = {
  dat: 'good', tot: 'good', on_track: 'good',
  can_theo_doi: 'warn', theo_doi: 'warn',
  bat_thuong: 'alert', xau: 'alert', canh_bao: 'alert',
  chua_du_du_lieu: 'neutral', khong_ket_luan: 'neutral',
}
const TREND_LABEL = {
  cai_thien: 'Đang cải thiện', giam: 'Đang cải thiện',
  on_dinh: 'Ổn định', đi_ngang: 'Đi ngang', di_ngang: 'Đi ngang',
  xau_di: 'Đang xấu đi', tang: 'Đang xấu đi',
  khong_ro: 'Chưa rõ',
}

function Section({ title, children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</div>
      {children}
    </div>
  )
}

function List({ items, tone = 'body' }) {
  if (!items || items.length === 0) return null
  const color = tone === 'alert' ? STATUS.alert.text : tone === 'good' ? STATUS.good.text : '#33433E'
  return (
    <ul className="space-y-1">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-sm" style={{ color }}>
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
          <span>{typeof t === 'string' ? t : JSON.stringify(t)}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AiTrendAssessment({ payload, hint }) {
  // payload = kết quả gmp_api_impurity_ai_latest: { found, created_at, ai: {...} } | null
  if (!payload) {
    return (
      <section className="card card-pad rise">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Nhận định của AI theo dây chuyền</h3>
          <span className="chip border-line text-muted">Chưa có</span>
        </div>
        <div className="mt-3 rounded-lg bg-mint-50/70 px-3 py-3 text-sm text-muted">
          {hint || 'Chưa có đánh giá AI cho dây chuyền này. Đánh giá được tạo tự động bởi luồng n8n (OpenAI) theo từng dây chuyền và lưu lại; chạy luồng hoặc đợi lịch chạy kế tiếp để xem nhận định.'}
        </div>
      </section>
    )
  }

  const ai = payload.ai || {}
  const status = STATUS_MAP[ai.overall_status] || 'neutral'
  const trend = TREND_LABEL[ai.overall_trend] || ai.overall_trend || '—'
  const validClaim = ai.general_trend_is_valid
  const [open, setOpen] = useState(false)
  const riskCount = (ai.high_risk_lots?.length || 0) + (ai.high_risk_products?.length || 0) + (ai.outlier_products?.length || 0)

  return (
    <section className="card overflow-hidden rise">
      <div className="card-pad" style={{ background: STATUS[status].bg, borderBottom: `1px solid ${STATUS[status].border}` }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="card-title" style={{ color: STATUS[status].text }}>
            Nhận định của AI{payload.scope_value ? ` — dây chuyền ${payload.scope_value}` : ''}
          </h3>
          <div className="flex items-center gap-2">
            <StatusChip status={status} />
            <span className="chip border-line bg-white/70 text-muted">Xu hướng: {trend}</span>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: STATUS[status].text }}>
          <span>Tạo lúc {fmtDate(payload.created_at)} · bởi {payload.created_by || 'n8n'}</span>
          {payload.data_cutoff && <span>· dữ liệu tính đến {fmtDate(payload.data_cutoff)}</span>}
          {payload.model && <span>· {payload.model}{payload.prompt_version ? ` (${payload.prompt_version})` : ''}</span>}
          {payload.threshold_pct != null && <span className="tnum">Ngưỡng {fmtPct(payload.threshold_pct)}</span>}
          {ai.confidence_level && <span>Độ tin cậy: {ai.confidence_level}</span>}
        </div>
      </div>

      <div className="card-pad space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-body">
            {validClaim === false
              ? 'CHƯA đủ cơ sở kết luận xu hướng chung — cần thêm dữ liệu/điều tra.'
              : typeof validClaim === 'boolean'
              ? 'Kết luận xu hướng chung được coi là hợp lệ với dữ liệu hiện có.'
              : 'Nhận định chi tiết bên dưới.'}
            {ai.suggested_stop_round != null && (
              <> · Đề xuất dừng ở <b>lần {ai.suggested_stop_round}</b></>
            )}
            <span className="text-muted"> · {ai.key_findings?.length || 0} phát hiện · {riskCount} điểm rủi ro</span>
          </div>
          <button onClick={() => setOpen((o) => !o)} className="chip border-line text-muted hover:text-ink shrink-0">
            {open ? 'Thu gọn ▴' : 'Xem chi tiết ▾'}
          </button>
        </div>

        {open && (
          <div className="space-y-4 pt-1">
            {typeof validClaim === 'boolean' && (
              <div
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  background: validClaim ? STATUS.good.bg : STATUS.warn.bg,
                  color: validClaim ? STATUS.good.text : STATUS.warn.text,
                }}
              >
                {validClaim
                  ? 'AI cho rằng kết luận xu hướng chung là HỢP LỆ với dữ liệu hiện có.'
                  : 'AI lưu ý: CHƯA đủ cơ sở để kết luận xu hướng chung — cần thêm dữ liệu/điều tra.'}
              </div>
            )}

            <Section title="Phát hiện chính"><List items={ai.key_findings} /></Section>
            <Section title="Bằng chứng (trích từ dữ liệu)"><List items={ai.supporting_evidence} /></Section>

            {(ai.high_risk_lots?.length || ai.high_risk_products?.length || ai.outlier_products?.length) ? (
              <Section title="Điểm rủi ro / bất thường">
                <List items={[...(ai.high_risk_lots || []), ...(ai.high_risk_products || []), ...(ai.outlier_products || [])]} tone="alert" />
              </Section>
            ) : null}

            <Section title="Khuyến nghị hành động"><List items={ai.recommended_actions} /></Section>

            {ai.limitations?.length ? (
              <Section title="Giới hạn của nhận định">
                <div className="rounded-lg bg-mint-50/70 px-3 py-2">
                  <List items={ai.limitations} />
                </div>
              </Section>
            ) : null}
          </div>
        )}

        <div className="rounded-lg bg-mint-50 px-3 py-2 text-xs text-pine">
          {ai.qa_note ||
            'Nhận định do AI tạo ra chỉ mang tính hỗ trợ. Mọi quyết định (đạt/không đạt, dừng/giảm số lần kiểm, mở điều tra) do QA phê duyệt theo SOP.'}
        </div>
      </div>
    </section>
  )
}
