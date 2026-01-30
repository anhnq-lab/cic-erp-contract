/**
 * Isolated Supabase Client for Data Operations
 * 
 * This client is separate from the Auth client to ensure:
 * 1. Data fetching is NOT blocked by auth state
 * 2. No race conditions between auth and data loading
 * 3. Reliable and predictable data access
 * 
 * Use this client for ALL data operations (select, insert, update, delete, rpc)
 * Use authClient (lib/supabase.ts) ONLY for auth operations (login, logout, session)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const dataClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,      // Don't save session to localStorage
        autoRefreshToken: false,    // Don't auto-refresh tokens
        detectSessionInUrl: false   // Don't look for auth tokens in URL
    }
});

// Export type for TypeScript
export type DataClient = typeof dataClient;
