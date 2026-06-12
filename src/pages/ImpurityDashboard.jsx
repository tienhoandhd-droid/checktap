import { useCallback, useEffect, useState } from 'react'
import { fetchDashboard, fetchLotList, fetchProductList, fetchLineList, fetchAiLatest } from '../api/impurityApi'
import { supabaseReady } from '../lib/supabaseClient'
import { overallStatus } from '../utils/trendRules'
import { fmtInt } from '../utils/formatters'

import ScopeFilters from '../components/ScopeFilters'
import KpiCards from '../components/KpiCards'
import StopRoundVerdict from '../components/StopRoundVerdict'
import AiTrendAssessment from '../components/AiTrendAssessment'
import OutlierPanel from '../components/OutlierPanel'
import LotRoundTrendChart from '../components/LotRoundTrendChart'
import CumulativeDetectionChart from '../components/CumulativeDetectionChart'
import InspectorConsistencyPanel from '../components/InspectorConsistencyPanel'
import HourOfDayChart from '../components/HourOfDayChart'
import ImpurityHeatmap from '../components/ImpurityHeatmap'
import ParetoTimeBucketChart from '../components/ParetoTimeBucketChart'
import ProductTrendChart from '../components/ProductTrendChart'
import ProductSmallMultiples from '../components/ProductSmallMultiples'
import ProductTimeHeatmap from '../components/ProductTimeHeatmap'
import ProductParetoChart from '../components/ProductParetoChart'
import LineParetoChart from '../components/LineParetoChart'
import DetailTable from '../components/DetailTable'
import { Loading, ErrorBlock, Empty } from '../components/StateBlocks'

const DEFAULT_FILTERS = {
  scopeType: 'system',
  scopeValue: null,
  lotId: null,
  productCode: null,
  productFamily: null,
  lineId: null,
  dateFrom: null,
  dateTo: null,
  thresholdPct: null,
}

function ConfigScreen() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card card-pad">
        <h2 className="font-display text-lg font-bold text-ink">Cần cấu hình kết nối Supabase</h2>
        <p className="mt-2 text-sm text-body">
          Dashboard chưa tìm thấy biến môi trường kết nối. Hãy tạo file <code className="rounded bg-mint-50 px-1">.env</code> ở thư mục
          <code className="rounded bg-mint-50 px-1">dashboard/</code> dựa trên <code className="rounded bg-mint-50 px-1">.env.example</code>:
        </p>
        <pre className="mt-3 overflow-auto rounded-lg bg-ink p-3 text-xs text-mint-50">
{`VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>`}
        </pre>
        <p className="mt-3 text-sm text-muted">
          Chỉ dùng <b>anon key</b> ở frontend. Sau khi tạo file, chạy lại <code className="rounded bg-mint-50 px-1">npm run dev</code>.
        </p>
      </div>
    </div>
  )
}

function DataQualityNote({ dq }) {
  if (!dq) return null
  const noTime = Number(dq.rows_no_time || 0)
  const noDate = Number(dq.rows_no_date || 0)
  const total = Number(dq.rows_total || 0)
  const excluded = Number(dq.rows_excluded_by_date || 0)
  const errScope = Number(dq.error_rows_in_scope || 0)
  const errAll = Number(dq.error_rows_all || 0)
  if (noTime === 0 && noDate === 0 && excluded === 0 && errScope === 0 && errAll === 0) return null
  const strong = excluded > 0 || errScope > 0 || noDate > 0
  return (
    <div className={'card card-pad no-print ' + (strong ? 'border-alert/40' : 'border-warn/30')}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-body">
        <span className={'font-medium ' + (strong ? 'text-alert' : 'text-warn')}>Lưu ý chất lượng dữ liệu:</span>
        {excluded > 0 && (
          <span className="tnum text-alert">{fmtInt(excluded)} bản ghi bị loại khỏi phân tích do bộ lọc NGÀY hiện tại.</span>
        )}
        {noDate > 0 && (
          <span className="tnum text-alert">{fmtInt(noDate)}/{fmtInt(total)} bản ghi thiếu ngày kiểm (sẽ bị loại nếu lọc theo ngày).</span>
        )}
        {errScope > 0 && (
          <span className="tnum text-alert">{fmtInt(errScope)} dòng thuộc phạm vi này bị tách sang bảng lỗi (CHƯA nhập — cần xử lý).</span>
        )}
        {noTime > 0 && (
          <span className="tnum">{fmtInt(noTime)}/{fmtInt(total)} bản ghi không có giờ kiểm (được phép, chỉ để biết).</span>
        )}
        {errScope === 0 && errAll > 0 && (
          <span className="tnum text-muted">{fmtInt(errAll)} dòng lỗi import ở các phạm vi khác.</span>
        )}
      </div>
    </div>
  )
}

export default function ImpurityDashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [lots, setLots] = useState([])
  const [products, setProducts] = useState([])
  const [lines, setLines] = useState([])
  const [dash, setDash] = useState(null)
  const [ai, setAi] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // tải danh sách lô + sản phẩm + dây chuyền (1 lần)
  useEffect(() => {
    if (!supabaseReady) return
    fetchLotList().then(({ data }) => data && setLots(data))
    fetchProductList().then(({ data }) => data && setProducts(data))
    fetchLineList().then(({ data }) => data && setLines(data))
  }, [])

  const load = useCallback(async () => {
    if (!supabaseReady) return
    // theo lô nhưng chưa chọn lô -> không gọi, hiển thị hướng dẫn
    if (filters.scopeType === 'lot' && !filters.lotId) {
      setDash(null); setAi(null); setError(null)
      return
    }
    setLoading(true); setError(null)
    // Nhận định AI theo TỪNG dây chuyền: chỉ lấy khi đã chọn line
    const aiParams = filters.lineId ? { scopeType: 'line', scopeValue: filters.lineId } : null
    const [{ data, error: e1 }, aiRes] = await Promise.all([
      fetchDashboard(filters),
      aiParams ? fetchAiLatest(aiParams) : Promise.resolve({ data: null }),
    ])
    if (e1) { setError(e1); setDash(null) }
    else { setDash(data); setAi(aiRes?.data || null) }
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  if (!supabaseReady) {
    return (
      <Shell>
        <ScopeBarPlaceholder />
        <ConfigScreen />
      </Shell>
    )
  }

  const isLot = filters.scopeType === 'lot'
  const isProduct = filters.scopeType === 'product'
  const isSystem = filters.scopeType === 'system'
  const threshold = dash?.threshold_pct
  const warning = dash?.warning_pct
  const overall = dash ? overallStatus({ summary: dash.summary, warnings: dash.warnings, outliers: dash.outliers, threshold }) : 'neutral'
  const empty = dash && dash.summary && Number(dash.summary.total_checked) === 0

  return (
    <Shell>
      <ScopeFilters
        value={filters}
        onChange={setFilters}
        lots={lots}
        products={products}
        lines={lines}
        onRefresh={load}
        loading={loading}
      />

      {isLot && !filters.lotId ? (
        <Empty title="Chọn một lô để xem chi tiết" hint="Dùng ô “Lô” phía trên để chọn lô cần phân tích xu hướng và đề xuất số lần kiểm." />
      ) : loading && !dash ? (
        <Loading />
      ) : error ? (
        <ErrorBlock error={error} onRetry={load} />
      ) : !dash ? (
        <Loading />
      ) : empty ? (
        <Empty title="Không có dữ liệu trong phạm vi đã chọn" hint="Thử mở rộng khoảng ngày hoặc đổi phạm vi." />
      ) : (
        <div className="space-y-4">
          <KpiCards summary={dash.summary} threshold={threshold} warning={warning} overall={overall} />
          <DataQualityNote dq={dash.data_quality} />

          {/* Hàng nổi bật: đề xuất số lần kiểm (lô) + nhận định AI */}
          {isLot ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print-grid">
              <StopRoundVerdict stop={dash.suggested_stop_round} threshold={threshold} />
              <AiTrendAssessment payload={ai} hint={!filters.lineId ? 'Chọn một dây chuyền (Line) ở bộ lọc phía trên để xem nhận định AI cho dây chuyền đó.' : undefined} />
            </div>
          ) : (
            <AiTrendAssessment payload={ai} hint={!filters.lineId ? 'Chọn một dây chuyền (Line) ở bộ lọc phía trên để xem nhận định AI cho dây chuyền đó.' : undefined} />
          )}

          {/* Biểu đồ tích luỹ phát hiện — phục vụ tiêu chí DỪNG KIỂM */}
          {isLot ? (
            <CumulativeDetectionChart data={dash.lot_round_trend} />
          ) : (
            <CumulativeDetectionChart
              data={dash.system_trend}
              title="Tạp mới theo lần & % tích luỹ — gộp theo phạm vi đang chọn"
              sub="Gộp tất cả lô trong phạm vi: đến lần thứ mấy thì gần như không còn bắt thêm tạp. Cột đỏ = tạp tái xuất hiện."
            />
          )}

          {/* Biểu đồ chính */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 print-grid">
            <LotRoundTrendChart data={dash.lot_round_trend} threshold={threshold} warning={warning} />
            <ParetoTimeBucketChart data={dash.pareto_kg} />
          </div>

          <ImpurityHeatmap data={dash.heatmap} lotId={isLot ? filters.lotId : null} />

          {/* Người kiểm (Data Integrity) + giờ kiểm */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 print-grid">
            <InspectorConsistencyPanel data={dash.by_inspector} threshold={threshold} warning={warning} />
            <HourOfDayChart data={dash.by_hour} threshold={threshold} warning={warning} />
          </div>

          {/* Theo sản phẩm (hệ thống / sản phẩm) */}
          {!isLot && (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 print-grid">
                <ProductTrendChart data={dash.product_trend} threshold={threshold} />
                <ProductParetoChart data={dash.product_pareto} />
              </div>
              <ProductSmallMultiples data={dash.product_trend} threshold={threshold} warning={warning} />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 print-grid">
                <ProductTimeHeatmap data={dash.product_family_trend} />
                <LineParetoChart data={dash.line_pareto} />
              </div>
            </>
          )}

          {/* Tín hiệu bất thường cần chú ý — đặt xuống dưới, sau các biểu đồ */}
          <OutlierPanel data={dash.outliers} />

          <DetailTable data={dash.lot_round_trend} threshold={threshold} warning={warning} />
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:px-5 sm:py-6">{children}</main>
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-base font-bold leading-tight text-ink">Phân tích xu hướng kiểm tạp</h1>
          <p className="text-xs text-muted">Theo dõi tỷ lệ tạp · đề xuất số lần kiểm · cảnh báo bất thường — theo nguyên tắc GMP/Data Integrity</p>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-5 py-6 text-center text-xs text-muted">
      Hệ thống hỗ trợ phân tích. Quyết định chất lượng do QA phê duyệt theo SOP và đánh giá rủi ro (QRM).
    </footer>
  )
}

function ScopeBarPlaceholder() {
  return <div className="h-1" />
}
