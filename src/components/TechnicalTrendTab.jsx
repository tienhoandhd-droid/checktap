import { useEffect, useState } from 'react'
import { fetchStatTrend } from '../api/impurityApi'
import { fmtPct, STATUS } from '../utils/formatters'
import { Loading, ErrorBlock, Empty } from './StateBlocks'
import {
  ResponsiveContainer, ComposedChart, Line, Area, Scatter, XAxis, YAxis,
  Tooltip, Legend, ReferenceLine, CartesianGrid
} from 'recharts'

function StatVerdict({ stats }) {
  if (!stats || stats.length === 0) return null
  return (
    <div className="card card-pad">
      <div className="card-title mb-3">Thống kê theo sản phẩm — cơ sở để đánh giá ổn định</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-line">
              <th className="pb-2 pr-3">Sản phẩm</th>
              <th className="pb-2 pr-3 text-right">Số lô</th>
              <th className="pb-2 pr-3 text-right">Trung vị</th>
              <th className="pb-2 pr-3 text-right">Q1</th>
              <th className="pb-2 pr-3 text-right">Q3</th>
              <th className="pb-2 pr-3 text-right">IQR</th>
              <th className="pb-2 pr-3 text-right">SD</th>
              <th className="pb-2">Kết luận thống kê</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(s => {
              const enough = s.stat_verdict === 'đủ cơ sở thống kê'
              return (
                <tr key={s.product_code} className="border-b border-line/50">
                  <td className="py-2 pr-3 font-medium text-ink">{s.product_code}</td>
                  <td className="py-2 pr-3 text-right tnum">{s.n_lots}</td>
                  <td className="py-2 pr-3 text-right tnum">{fmtPct(s.median_rate, 3)}</td>
                  <td className="py-2 pr-3 text-right tnum">{fmtPct(s.q1, 3)}</td>
                  <td className="py-2 pr-3 text-right tnum">{fmtPct(s.q3, 3)}</td>
                  <td className="py-2 pr-3 text-right tnum">{fmtPct(s.iqr, 3)}</td>
                  <td className="py-2 pr-3 text-right tnum">{fmtPct(s.sd, 3)}</td>
                  <td className="py-2">
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{ background: enough ? STATUS.good.bg : STATUS.neutral.bg,
                                   color: enough ? STATUS.good.text : STATUS.neutral.text }}>
                      {s.stat_verdict}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted">
        Cần ≥ 5 lô để có đủ cơ sở thống kê cho control chart. IQR = Q3 − Q1 (khoảng phân tán bền vững).
      </div>
    </div>
  )
}

function ControlChart({ lotTrend, productCode }) {
  if (!lotTrend || lotTrend.length < 3) return (
    <div className="card card-pad text-center text-sm text-muted py-8">
      Chưa đủ dữ liệu cho control chart ({lotTrend?.length || 0} lô, cần ≥ 3).
    </div>
  )

  const chartData = lotTrend.map(d => ({
    lot: d.lot_id,
    rate: Number(d.rate),
    ma3: d.ma3 != null ? Number(d.ma3) : null,
    ma5: d.ma5 != null ? Number(d.ma5) : null,
    ucl: d.ucl_3sigma != null ? Number(d.ucl_3sigma) : null,
    uwl: d.uwl_2sigma != null ? Number(d.uwl_2sigma) : null,
    lcl: d.lcl_3sigma != null ? Number(d.lcl_3sigma) : null,
    mean: d.expanding_mean != null ? Number(d.expanding_mean) : null,
    n: Number(d.n_lots_so_far),
  }))

  const maxRate = Math.max(...chartData.map(d => Math.max(d.rate, d.ucl || 0)))

  return (
    <div className="card card-pad">
      <div className="card-title">Shewhart control chart{productCode ? ` — ${productCode}` : ''}</div>
      <div className="card-sub mb-3">
        Tỷ lệ tạp theo lô + trung bình trượt + giới hạn kiểm soát (UCL 3σ / UWL 2σ).
        Lô ngoài UCL = bất ổn thống kê → chưa nên giảm kiểm.
      </div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="lot" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
            <YAxis domain={[0, Math.ceil(maxRate * 1.1)]} tick={{ fontSize: 11 }}
                   label={{ value: 'Tỷ lệ tạp (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, n) => [fmtPct(v, 3), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />

            {/* UCL/UWL bands */}
            <Line dataKey="ucl" name="UCL (3σ)" stroke="#C0563F" strokeDasharray="6 3" strokeWidth={1.5} dot={false} />
            <Line dataKey="uwl" name="UWL (2σ)" stroke="#B9842B" strokeDasharray="4 4" strokeWidth={1} dot={false} />
            <Line dataKey="mean" name="Trung bình" stroke="#64748B" strokeDasharray="2 2" strokeWidth={1} dot={false} />

            {/* MA lines */}
            <Line dataKey="ma3" name="MA(3 lô)" stroke="#2E8B74" strokeWidth={2} dot={false} connectNulls />
            <Line dataKey="ma5" name="MA(5 lô)" stroke="#1D6B8A" strokeWidth={1.5} dot={false} connectNulls />

            {/* Actual data points */}
            <Scatter dataKey="rate" name="Tỷ lệ lô" fill="#15302A" r={5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function EwmaChart({ ewmaData, productCode }) {
  if (!ewmaData || ewmaData.length < 2) return null

  const chartData = ewmaData.map(d => ({
    lot: d.lot_id,
    rate: Number(d.rate),
    ewma: Number(d.ewma),
    ucl: d.ewma_ucl != null ? Number(d.ewma_ucl) : null,
    target: d.target_mean != null ? Number(d.target_mean) : null,
  }))

  return (
    <div className="card card-pad">
      <div className="card-title">EWMA (λ=0.3){productCode ? ` — ${productCode}` : ''}</div>
      <div className="card-sub mb-3">
        Bắt xu hướng tăng nhỏ kéo dài mà Shewhart không thấy.
        EWMA vượt UCL = quy trình đang dịch chuyển → cần điều tra trước khi giảm kiểm.
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="lot" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }}
                   label={{ value: '%', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v, n) => [fmtPct(v, 3), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />

            <Line dataKey="ucl" name="EWMA UCL" stroke="#C0563F" strokeDasharray="6 3" strokeWidth={1.5} dot={false} />
            <Line dataKey="target" name="Trung bình mục tiêu" stroke="#64748B" strokeDasharray="2 2" strokeWidth={1} dot={false} />
            <Line dataKey="ewma" name="EWMA" stroke="#2E8B74" strokeWidth={2.5} dot={{ r: 4, fill: '#2E8B74' }} />
            <Scatter dataKey="rate" name="Tỷ lệ thô" fill="#B9842B" r={3} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function TechnicalTrendTab({ filters }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchStatTrend({
      productCode: filters.productCode,
      lineId: filters.lineId,
    }).then(({ data: d, error: e }) => {
      if (e) setError(e); else setData(d)
      setLoading(false)
    })
  }, [filters.productCode, filters.lineId])

  useEffect(() => {
    if (data?.product_stats?.length && !selectedProduct) {
      const enough = data.product_stats.find(p => p.stat_verdict === 'đủ cơ sở thống kê')
      setSelectedProduct(enough?.product_code || data.product_stats[0].product_code)
    }
  }, [data])

  if (loading) return <Loading />
  if (error) return <ErrorBlock error={error} />
  if (!data) return <Empty title="Không có dữ liệu thống kê" />

  const products = [...new Set((data.lot_trend || []).map(d => d.product_code))]
  const lotFiltered = (data.lot_trend || []).filter(d => !selectedProduct || d.product_code === selectedProduct)
  const ewmaFiltered = (data.ewma || []).filter(d => !selectedProduct || d.product_code === selectedProduct)

  return (
    <div className="space-y-4">
      {/* Verdict context */}
      <div className="card card-pad" style={{ background: STATUS.good.bg, borderColor: STATUS.good.border }}>
        <div className="text-sm" style={{ color: STATUS.good.text }}>
          <span className="font-medium">Mục tiêu tab này:</span> xác nhận quy trình đủ ổn định để giảm số lần kiểm.
          Nếu control chart cho thấy lô nằm trong UCL, MA không tăng, và EWMA dưới giới hạn → quy trình ổn định.
          Nếu có lô ngoài UCL hoặc EWMA vượt → cần điều tra trước.
        </div>
      </div>

      {/* Product selector */}
      {products.length > 1 && (
        <div className="flex flex-wrap gap-2 text-xs no-print">
          {products.map(p => (
            <button key={p} onClick={() => setSelectedProduct(p)}
                    className={`rounded-lg px-3 py-1.5 border ${selectedProduct === p ? 'bg-ink text-white border-ink' : 'border-line text-body hover:bg-page'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Product stats table */}
      <StatVerdict stats={data.product_stats} />

      {/* Control chart */}
      <ControlChart lotTrend={lotFiltered} productCode={selectedProduct} />

      {/* EWMA chart */}
      <EwmaChart ewmaData={ewmaFiltered} productCode={selectedProduct} />

      {/* Line stats */}
      {data.line_stats?.length > 0 && (
        <div className="card card-pad">
          <div className="card-title mb-3">Thống kê theo dây chuyền</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-line">
                  <th className="pb-2 pr-3">Dây chuyền</th>
                  <th className="pb-2 pr-3 text-right">Số lô</th>
                  <th className="pb-2 pr-3 text-right">Trung vị</th>
                  <th className="pb-2 pr-3 text-right">SD</th>
                  <th className="pb-2">Kết luận</th>
                </tr>
              </thead>
              <tbody>
                {data.line_stats.map(l => {
                  const enough = l.stat_verdict === 'đủ cơ sở thống kê'
                  return (
                    <tr key={l.line_id} className="border-b border-line/50">
                      <td className="py-2 pr-3 font-medium text-ink">{l.line_id}</td>
                      <td className="py-2 pr-3 text-right tnum">{l.n_lots}</td>
                      <td className="py-2 pr-3 text-right tnum">{fmtPct(l.median_rate, 3)}</td>
                      <td className="py-2 pr-3 text-right tnum">{fmtPct(l.sd, 3)}</td>
                      <td className="py-2">
                        <span className="rounded-md px-2 py-0.5 text-xs font-medium"
                              style={{ background: enough ? STATUS.good.bg : STATUS.neutral.bg,
                                       color: enough ? STATUS.good.text : STATUS.neutral.text }}>
                          {l.stat_verdict}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
