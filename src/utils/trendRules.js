// Quy tắc đánh giá xu hướng (BẢN SAO phía client để hiển thị/kiểm chứng).
// Nguồn quyết định chính thức là RPC Supabase (gmp_fn_suggest_stop_round).
// Hàm này giúp UI hiển thị nhất quán và kiểm tra chéo kết quả backend.

// Tính lại tỷ lệ toàn lô theo lần kiểm từ mảng lot_round_trend (1 lô).
export function ratesByRound(lotRoundTrend, lotId) {
  const rows = lotRoundTrend.filter((r) => !lotId || r.lot_id === lotId)
  const max = rows.reduce((m, r) => Math.max(m, Number(r.check_round)), 0)
  const arr = Array(max + 1).fill(null)
  for (const r of rows) arr[Number(r.check_round)] = r.rate === null ? null : Number(r.rate)
  return arr // arr[round] = rate
}

// Mirror quy tắc dừng kiểm. Trả {stop, reason} — KHÔNG thay backend.
export function suggestStopRound(arr, threshold = 0.1, requiredClean = 2, heatmapBadAtRound = () => false) {
  const max = arr.length - 1
  if (max < 1) return { stop: null, reason: 'khong_co_du_lieu' }

  // chuỗi đạt liên tiếp tính từ cuối lô
  let cleanEnd = 0
  for (let n = max; n >= 1; n--) {
    if (arr[n] !== null && arr[n] <= threshold) cleanEnd++
    else break
  }

  let reason = 'chua_du_co_so'
  for (let n = 1; n <= max - 1; n++) {
    if (arr[n] === null || arr[n + 1] === null) continue
    if (arr[n] <= threshold && arr[n + 1] <= threshold) {
      const kgBad = heatmapBadAtRound(n)
      const laterBad = arr.slice(n + 1).some((r) => r !== null && r > threshold)
      if (!kgBad && !laterBad && cleanEnd >= requiredClean) {
        return { stop: n, reason: 'dat', cleanEnd }
      }
      if (kgBad) reason = 'dieu_tra_kg'
      else if (laterBad) reason = 'tap_tai_xuat_hien'
    }
  }
  return { stop: null, reason, cleanEnd }
}

// Suy ra trạng thái tổng thể cho phạm vi hiện tại (dùng khi không có 1 lô cụ thể).
// Quy tắc thận trọng theo GMP: có bất thường -> "Bất thường";
// còn lần kiểm vượt ngưỡng nhưng không outlier -> "Cần theo dõi"; sạch -> "Đạt".
export function overallStatus({ summary, warnings, outliers, threshold }) {
  if (!summary || summary.total_checked === 0) return 'neutral'
  const hasOutlier = (outliers?.length ?? 0) > 0
  const hasOverThreshold = (warnings?.length ?? 0) > 0
  const rate = Number(summary.rate ?? 0)
  if (hasOutlier) return 'alert'
  if (hasOverThreshold || rate > Number(threshold ?? 0.1)) return 'warn'
  return 'good'
}
