import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' tạo đường dẫn tài nguyên tương đối -> chạy được trên GitHub Pages
// cho cả "user site" (user.github.io) lẫn "project site" (user.github.io/<repo>/).
// Nếu muốn cố định theo repo, đổi thành '/<ten-repo>/'.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          recharts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
