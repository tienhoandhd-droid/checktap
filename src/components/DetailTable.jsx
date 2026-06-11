import { useMemo, useState } from 'react'
import { fmtInt, fmtPct, rateStatus } from '../utils/formatters'

// Bảng chi tiết theo lô × lần kiểm (số kiểm, số tạp, tỷ lệ). Có sắp xếp + lọc nhanh.
export default function DetailTable({ data, threshold, warning }) {
  const [sort, setSort] = useState({ key: 'lot_id', dir: 'asc' })
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    let r = [...(data || [])]
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      r = r.filter((x) => String(x.lot_id).toLowerCase().includes(s))
    }
    r.sort((a, b) => {
      const k = sort.key
      let av = a[k], bv = b[k]
      if (k === 'rate' || k === 'checked_qty' || k === 'impurity_qty' || k === 'check_round') {
        av = Number(av); bv = Number(bv)
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return r
  }, [data, q, sort])

  const th = (key, label, extra = '') => (
    <th
      className={`cursor-pointer select-none px-3 py-2 text-left font-semibold text-muted hover:text-pine ${extra}`}
      onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
    >
      {label} {sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
    </th>
  )

  return (
    <section className="card card-pad rise">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="card-title">Chi tiết theo lô × lần kiểm</h3>
          <p className="card-sub">Tỷ lệ mỗi dòng = Σ tạp ÷ Σ kiểm của lô tại lần đó.</p>
        </div>
        <input
          className="field max-w-[220px] no-print"
          placeholder="Lọc theo mã lô…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="max-h-[420px] overflow-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-mint-50">
            <tr className="border-b border-line">
              {th('lot_id', 'Lô')}
              {th('check_round', 'Lần', 'text-right')}
              {th('checked_qty', 'Số kiểm', 'text-right')}
              {th('impurity_qty', 'Số tạp', 'text-right')}
              {th('rate', 'Tỷ lệ', 'text-right')}
              <th className="px-3 py-2 text-left font-semibold text-muted">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Không có dữ liệu.</td></tr>
            ) : (
              rows.map((r, i) => {
                const st = rateStatus(r.rate, threshold, warning)
                return (
                  <tr key={i} className="border-b border-line/60 last:border-0 hover:bg-mint-50/40">
                    <td className="px-3 py-1.5 tnum">{r.lot_id}</td>
                    <td className="px-3 py-1.5 text-right tnum">{r.check_round}</td>
                    <td className="px-3 py-1.5 text-right tnum">{fmtInt(r.checked_qty)}</td>
                    <td className="px-3 py-1.5 text-right tnum">{fmtInt(r.impurity_qty)}</td>
                    <td className="px-3 py-1.5 text-right tnum font-medium" style={{ color: st.dot }}>{fmtPct(r.rate)}</td>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: st.text }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
