import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Chỉ dùng ANON KEY ở frontend. Không bao giờ đặt service_role key tại đây.
export const supabaseReady = Boolean(url && anonKey)

if (!supabaseReady) {
  // Không ném lỗi cứng để app vẫn render được màn hình hướng dẫn cấu hình.
  console.warn(
    '[Cấu hình] Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY. ' +
      'Tạo file .env từ .env.example rồi chạy lại.'
  )
}

export const supabase = supabaseReady
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null
