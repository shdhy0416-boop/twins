import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AccountMode } from '../types';

const envMeta = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
const supabaseUrl = envMeta.VITE_SUPABASE_URL || '';
const supabaseAnonKey = envMeta.VITE_SUPABASE_ANON_KEY || '';

/**
 * Preparation-phase safety lock.
 * Keeps TWIN strictly in local demo mode even if environment variables are present,
 * preventing accidental connection to a live database or auth provider until
 * migrations, RLS policies, and production auth providers are verified and enabled.
 */
export const DEMO_MODE_ONLY_LOCK = true;

export const hasSupabaseEnvVars = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('<your-project-ref>')
  );
};

export const isSupabaseConfigured = (): boolean => {
  if (DEMO_MODE_ONLY_LOCK) {
    return false;
  }
  return hasSupabaseEnvVars();
};

export const getActiveAccountMode = (): AccountMode => {
  return isSupabaseConfigured() ? 'authenticated' : 'demo';
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'twin:v2:auth:supabase_session',
      },
    })
  : null;

