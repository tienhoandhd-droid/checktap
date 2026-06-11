import { fmtInt, fmtPct, rateStatus, STATUS } from '../utils/formatters'
import { StatusChip } from './StateBlocks'

function Kpi({ label, value, sub, accent }) {
  return (
    <div className="card card-pad rise">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tnum" style={{ color: accent || '#15302A' }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted tnum">{sub}</div>}
    </div>
  )
}

export default function KpiCards({ summary, threshold, warning, overall }) {
  if (!summary) return null
  const st = rateStatus(summary.rate, threshold, warning)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div className="card card-pad rise col-span-2 sm:col-span-1">
        <div className="text-xs font-medium text-muted">Tỷ lệ tạp chung</div>
        <div className="mt-1 font-display text-3xl font-bold tnum" style={{ color: st.dot }}>
          {fmtPct(summary.rate)}
        </div>
        <div className="mt-1.5">
          <StatusChip status={overall || st.key} />
        </div>
        <div className="mt-1 text-[11px] text-muted tnum">Ngưỡng {fmtPct(threshold)}</div>
      </div>
      <Kpi label="Tổng đơn vị kiểm" value={fmtInt(summary.total_checked)} sub={`${fmtInt(summary.total_impurity)} đơn vị tạp`} />
      <Kpi label="Số lô" value={fmtInt(summary.lots)} sub={`${fmtInt(summary.products)} sản phẩm`} accent={STATUS.good.text} />
      <Kpi label="Số khung kiểm (KG)" value={fmtInt(summary.kgs)} />
      <Kpi label="Số lần kiểm (tối đa)" value={fmtInt(summary.rounds)} />
    </div>
  )
}
