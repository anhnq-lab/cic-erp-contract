/**
 * Isolated Supabase Client for Data Operations
 *
 * Client này tách biệt với Auth client để đảm bảo:
 * 1. Data fetching KHÔNG bị chặn bởi auth state
 * 2. Không có race condition giữa auth và data loading
 * 3. Truy cập dữ liệu đáng tin cậy, dự đoán được
 *
 * Dùng client này cho MỌI thao tác dữ liệu (select, insert, update, delete, rpc)
 * Dùng authClient (lib/supabase.ts) CHỈ cho thao tác auth (login, logout, session)
 *
 * Auth session được sync từ authClient để DB triggers (vd: audit_logs)
 * có thể nhận diện user qua auth.uid().
 *
 * ⚠️  BẢO MẬT: Client này LUÔN dùng anon key.
 *     Service role key KHÔNG BAO GIỜ được dùng ở đây vì Vite bundle
 *     mọi biến VITE_* vào client code → lộ service_role = bypass toàn bộ RLS.
 *     Service role chỉ dùng trong: api/, supabase/functions/, scripts/, workers/
 */

import { createClient, Session } from '@supabase/supabase-js';
import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL } from './supabaseDefaults';

function getEnv(key: string, backup: string = ''): string {
  try {
    if (typeof (import.meta as any).env !== 'undefined') {
      const val = (import.meta as any).env[key];
      if (val) return val;
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return process.env[key] as string;
    }
  } catch {}
  return backup;
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL', DEFAULT_SUPABASE_URL);

// Luôn dùng anon key — KHÔNG dùng service_role ở client
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY', DEFAULT_SUPABASE_ANON_KEY);

export const dataClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,      // Không lưu session vào localStorage
        autoRefreshToken: false,    // Không tự refresh token
        detectSessionInUrl: false   // Không tìm auth token trong URL
    }
});

/**
 * Sync the auth session from authClient into dataClient.
 * This ensures DB triggers (like process_audit_log) can resolve auth.uid()
 * to the actual logged-in user instead of returning null.
 * 
 * Called from AuthContext whenever auth state changes.
 */
export async function syncAuthSession(session: Session | null): Promise<void> {
    if (session?.access_token && session?.refresh_token) {
        await dataClient.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
        });
    }
}

// Export type for TypeScript
export type DataClient = typeof dataClient;
