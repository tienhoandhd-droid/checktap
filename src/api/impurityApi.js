import { supabase, supabaseReady } from '../lib/supabaseClient'

// Lớp API: chỉ gọi RPC SECURITY DEFINER, KHÔNG đọc trực tiếp bảng gốc.
// Mọi hàm trả về { data, error } để UI xử lý loading/error/empty đồng nhất.

function guard() {
  if (!supabaseReady) {
    return {
      error: new Error(
        'Chưa cấu hình Supabase. Tạo file .env từ .env.example (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).'
      ),
    }
  }
  return null
}

export async function fetchDashboard(params) {
  const g = guard()
  if (g) return g
  const payload = {
    p_scope_type: params.scopeType,
    p_scope_value: params.scopeValue ?? null,
    p_lot_id: params.lotId ?? null,
    p_product_code: params.productCode ?? null,
    p_product_family: params.productFamily ?? null,
    p_line_id: params.lineId ?? null,
    p_date_from: params.dateFrom ?? null,
    p_date_to: params.dateTo ?? null,
    p_threshold_pct: params.thresholdPct ?? null,
  }
  const { data, error } = await supabase.rpc('gmp_api_impurity_dashboard', payload)
  return { data, error }
}

export async function fetchLotList() {
  const g = guard()
  if (g) return g
  const { data, error } = await supabase.rpc('gmp_api_impurity_lot_list')
  return { data: data ?? [], error }
}

export async function fetchProductList() {
  const g = guard()
  if (g) return g
  const { data, error } = await supabase.rpc('gmp_api_impurity_product_list')
  return { data: data ?? [], error }
}

export async function fetchLineList() {
  const g = guard()
  if (g) return g
  const { data, error } = await supabase.rpc('gmp_api_impurity_line_list')
  return { data: data ?? [], error }
}

export async function fetchAiLatest(params) {
  const g = guard()
  if (g) return g
  const { data, error } = await supabase.rpc('gmp_api_impurity_ai_latest', {
    p_scope_type: params.scopeType,
    p_scope_value: params.scopeValue ?? null,
    p_lot_id: params.lotId ?? null,
    p_product_code: params.productCode ?? null,
    p_product_family: params.productFamily ?? null,
  })
  return { data, error } // data = null nếu chưa có đánh giá AI cho phạm vi này
}

// ---- UPGRADE V2: Risk scoring engine ----
export async function fetchRiskSignals(params = {}) {
  const g = guard()
  if (g) return g
  const { data, error } = await supabase.rpc('gmp_api_impurity_risk_signals', {
    p_lot_id: params.lotId ?? null,
    p_product_code: params.productCode ?? null,
    p_line_id: params.lineId ?? null,
  })
  return { data: data ?? [], error }
}

// ---- UPGRADE V2: Statistical trend (MA, control chart, EWMA) ----
export async function fetchStatTrend(params = {}) {
  const g = guard()
  if (g) return g
  const { data, error } = await supabase.rpc('gmp_api_impurity_stat_trend', {
    p_product_code: params.productCode ?? null,
    p_line_id: params.lineId ?? null,
  })
  return { data, error }
}

// ---- UPGRADE V2: Cumulative detection per lot ----
export async function fetchCumulative(lotId) {
  const g = guard()
  if (g) return g
  const { data, error } = await supabase.rpc('gmp_api_impurity_cumulative', {
    p_lot_id: lotId,
  })
  return { data: data ?? [], error }
}

// ---- UPGRADE V2: Import reconciliation report ----
export async function fetchReconciliation() {
  const g = guard()
  if (g) return g
  const { data, error } = await supabase.rpc('gmp_api_impurity_reconciliation')
  return { data: data ?? [], error }
}
