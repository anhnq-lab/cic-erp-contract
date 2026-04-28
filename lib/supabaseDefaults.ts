/**
 * Giá trị mặc định cho môi trường DEV LOCAL.
 *
 * ⚠️  CHỈ dùng khi không có .env.local (tức là local dev không cấu hình).
 *     Production BẮT BUỘC phải set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 *     trong Vercel environment variables. Nếu không, build sẽ cảnh báo rõ ràng.
 *
 * Đây là anon key — được thiết kế để công khai (không phải secret).
 * Bảo mật dựa trên RLS policies trong Supabase, không phải ẩn key này.
 * Xem thêm: plans/260427-optimization-roadmap/phase-0-security.md
 */

// Cảnh báo nếu đang dùng default trong production
if (typeof window !== 'undefined') {
  const isProd = !['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
  const hasCustomUrl = !!(import.meta as any).env?.VITE_SUPABASE_URL;

  if (isProd && !hasCustomUrl) {
    console.error(
      '[Supabase] ⚠️  VITE_SUPABASE_URL chưa được cấu hình cho production!\n' +
      'Vào Vercel → Settings → Environment Variables → thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.\n' +
      'Hướng dẫn: xem file .env.example'
    );
  }
}

export const DEFAULT_SUPABASE_URL = 'https://jyohocjsnsyfgfsmjfqx.supabase.co';

export const DEFAULT_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5b2hvY2pzbnN5Zmdmc21qZnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MzQ3MzgsImV4cCI6MjA1MzExMDczOH0.geU7wqhNwO3eBmf_QLnLxoS5bGBxJRqotXw6qz5l6dA';
