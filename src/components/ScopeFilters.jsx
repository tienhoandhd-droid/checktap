import { fmtPct } from '../utils/formatters'

const SCOPES = [
  { key: 'system', label: 'Toàn hệ thống' },
  { key: 'product', label: 'Theo sản phẩm' },
  { key: 'lot', label: 'Theo lô' },
]

export default function ScopeFilters({ value, onChange, lots, products, lines, onRefresh, loading }) {
  const set = (patch) => onChange({ ...value, ...patch })

  // Lọc phân tầng: chọn Line thì chỉ hiện lô/sản phẩm thuộc line đó
  const inLine = (x) => !value.lineId || x.line_id === value.lineId
  const filteredLots = (lots || []).filter(inLine)
  const filteredProducts = (products || []).filter(inLine)

  return (
    <div className="card card-pad no-print">
      {/* Tabs phạm vi */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-line bg-mint-50/60 p-0.5">
          {SCOPES.map((s) => {
            const active = value.scopeType === s.key
            return (
              <button
                key={s.key}
                onClick={() =>
                  set({
                    scopeType: s.key,
                    // dọn lựa chọn không phù hợp khi đổi phạm vi
                    lotId: s.key === 'lot' ? value.lotId : null,
                    productCode: s.key === 'product' ? value.productCode : null,
                  })
                }
                className={
                  'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                  (active ? 'bg-white text-pine shadow-sm' : 'text-muted hover:text-pine')
                }
              >
                {s.label}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-pine hover:bg-mint-50 disabled:opacity-50"
          >
            {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-pine hover:bg-mint-50"
          >
            In / Xuất PDF
          </button>
        </div>
      </div>

      {/* Bộ lọc chi tiết */}
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div>
          <label className="field-label">Dây chuyền (Line)</label>
          <select
            className="field"
            value={value.lineId || ''}
            onChange={(e) => set({ lineId: e.target.value || null, lotId: null, productCode: null })}
          >
            <option value="">— Tất cả line —</option>
            {(lines || []).map((l) => (
              <option key={l.line_id} value={l.line_id}>
                {l.line_id} · {l.lot_count} lô · {fmtPct(l.rate)}
              </option>
            ))}
          </select>
        </div>
        {value.scopeType === 'lot' && (
          <div>
            <label className="field-label">Lô</label>
            <select
              className="field"
              value={value.lotId || ''}
              onChange={(e) => set({ lotId: e.target.value || null })}
            >
              <option value="">{value.lineId ? `— Chọn lô (${filteredLots.length}) —` : '— Chọn lô —'}</option>
              {filteredLots.map((l) => (
                <option key={l.lot_id} value={l.lot_id}>
                  {l.lot_id} · {l.product_code} · {fmtPct(l.rate)}
                </option>
              ))}
            </select>
          </div>
        )}

        {value.scopeType === 'product' && (
          <div>
            <label className="field-label">Sản phẩm</label>
            <select
              className="field"
              value={value.productCode || ''}
              onChange={(e) => set({ productCode: e.target.value || null })}
            >
              <option value="">— Tất cả sản phẩm —</option>
              {filteredProducts.map((p) => (
                <option key={p.product_code} value={p.product_code}>
                  {p.product_code} · {p.lot_count} lô · {fmtPct(p.rate)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="field-label">Từ ngày</label>
          <input
            type="date"
            className="field"
            value={value.dateFrom || ''}
            onChange={(e) => set({ dateFrom: e.target.value || null })}
          />
        </div>
        <div>
          <label className="field-label">Đến ngày</label>
          <input
            type="date"
            className="field"
            value={value.dateTo || ''}
            onChange={(e) => set({ dateTo: e.target.value || null })}
          />
        </div>

        <div>
          <label className="field-label">Ngưỡng (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="vd 0.10"
            className="field tnum"
            value={value.thresholdPct ?? ''}
            onChange={(e) => set({ thresholdPct: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}
