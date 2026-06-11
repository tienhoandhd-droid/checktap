// Định dạng số/phần trăm/ngày + bảng màu trạng thái (đồng nhất toàn app).

export function fmtPct(v, digits = 2) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  return `${Number(v).toFixed(digits)}%`
}

export function fmtInt(v) {
  if (v === null || v === undefined || v === '') return '—'
  return Number(v).toLocaleString('vi-VN')
}

export function fmtDate(v) {
  if (!v) return '—'
  // v dạng 'YYYY-MM-DD' -> 'DD/MM/YYYY'
  const s = String(v).slice(0, 10)
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return s
  return `${d}/${m}/${y}`
}

// Bảng màu trạng thái GMP (dịu, hợp in ấn)
export const STATUS = {
  good: { key: 'good', label: 'Đạt', text: '#1b6b58', bg: '#E8F3EF', border: '#BBDDCF', dot: '#2E8B74' },
  warn: { key: 'warn', label: 'Cần theo dõi', text: '#8a6418', bg: '#FBF3E2', border: '#EAD7AC', dot: '#B9842B' },
  alert: { key: 'alert', label: 'Bất thường', text: '#9c4030', bg: '#FaEbe7', border: '#E7C2B8', dot: '#C0563F' },
  neutral: { key: 'neutral', label: 'Chưa đủ dữ liệu', text: '#475569', bg: '#EEF2F5', border: '#CBD5DD', dot: '#64748B' },
}

// Màu theo tỷ lệ tạp so với ngưỡng (dùng cho heatmap & nhãn)
export function rateStatus(rate, threshold, warning) {
  if (rate === null || rate === undefined) return STATUS.neutral
  const r = Number(rate)
  const thr = Number(threshold ?? 0.1)
  const warn = Number(warning ?? thr * 0.5)
  if (r <= warn) return STATUS.good
  if (r <= thr) return STATUS.warn
  return STATUS.alert
}

// Thang màu nền heatmap: 0% -> trắng mint; tăng dần -> đỏ đất.
export function heatColor(rate) {
  if (rate === null || rate === undefined) return '#F3F7F5'
  const r = Math.max(0, Math.min(Number(rate), 20))
  if (r === 0) return '#EAF5F0'
  // nội suy mint -> vàng -> đỏ đất theo log để mức thấp vẫn phân biệt được
  const t = Math.min(Math.log10(1 + r) / Math.log10(1 + 20), 1)
  const stops = [
    [0.0, [0xd7, 0xea, 0xe2]],
    [0.25, [0xf2, 0xe6, 0xb0]],
    [0.55, [0xe6, 0xb2, 0x6a]],
    [1.0, [0xc0, 0x56, 0x3f]],
  ]
  let a = stops[0], b = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      a = stops[i]; b = stops[i + 1]; break
    }
  }
  const span = b[0] - a[0] || 1
  const k = (t - a[0]) / span
  const ch = (i) => Math.round(a[1][i] + (b[1][i] - a[1][i]) * k)
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}

export function textOn(bgRgb) {
  // chọn chữ tối/sáng theo độ sáng nền
  const m = /rgb\((\d+), (\d+), (\d+)\)/.exec(bgRgb)
  if (!m) return '#15302A'
  const [r, g, b] = [+m[1], +m[2], +m[3]]
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#15302A' : '#FFFFFF'
}

// Nhãn lý do đề xuất dừng kiểm (từ RPC) -> tiếng Việt + trạng thái
export const STOP_REASON = {
  dat: {
    status: 'good',
    title: 'Đủ cơ sở đề xuất dừng',
    desc: 'Tỷ lệ tạp đạt ngưỡng tại lần đề xuất và lần kế tiếp, không có khung bất thường, không tăng lại về cuối lô.',
  },
  chua_du_co_so: {
    status: 'neutral',
    title: 'Chưa đủ cơ sở',
    desc: 'Chưa có đủ lần kiểm liên tiếp đạt ngưỡng (hoặc thiếu lần n+1) để xác nhận. Cần kiểm thêm.',
  },
  dieu_tra_kg: {
    status: 'warn',
    title: 'Chưa nên giảm — điều tra khung (KG)',
    desc: 'Tổng lô có thể đạt nhưng còn KG vượt ngưỡng. Cần điều tra khung bất thường trước.',
  },
  tap_tai_xuat_hien: {
    status: 'alert',
    title: 'Chưa nên giảm — tạp tái xuất hiện',
    desc: 'Có lần kiểm sạch rồi tạp xuất hiện lại ở lần sau. Không được dừng dựa trên một lần sạch.',
  },
  khong_co_du_lieu: {
    status: 'neutral',
    title: 'Không có dữ liệu',
    desc: 'Lô chưa có dữ liệu kiểm.',
  },
}
