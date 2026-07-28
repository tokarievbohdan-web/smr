import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY, DATA_MODE, isSupabaseConfigured } from './supabaseConfig';

export { isSupabaseConfigured };

// Production-гард: у режимі supabase ключі обовʼязкові — жодного тихого
// fallback на локальні дані. Некоректна конфігурація має падати явно.
if (DATA_MODE === 'supabase' && !isSupabaseConfigured) {
  throw new Error(
    'DATA_MODE=supabase, але EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY не задані. ' +
    'Задайте ключі у .env або переключіть DATA_MODE=mock для локальної розробки.'
  );
}

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
