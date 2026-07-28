import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './supabaseConfig';

export { isSupabaseConfigured };

/**
 * Клієнт Supabase. Створюється лише коли задані URL + anon key
 * (src/supabaseConfig.ts). Інакше залишається null, і застосунок
 * використовує локальні стори (AuthService, *Store) як fallback.
 * Чистий JS — OTA-safe, без нових нативних модулів (сесія персиститься
 * у вже наявному AsyncStorage).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
