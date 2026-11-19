import 'react-native-url-polyfill/auto';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';

// SecureStore values are split into chunks so longer Supabase sessions are not
// constrained by the platform's per-item size limit.
const CHUNK_SIZE = 1800;
const secureStorage: SupportedStorage = {
  async getItem(key) {
    const countRaw = await SecureStore.getItemAsync(`${key}.chunks`);
    if (countRaw) {
      const count = Number(countRaw);
      if (!Number.isInteger(count) || count < 1 || count > 20) return null;
      const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)));
      return chunks.some((part) => part === null) ? null : chunks.join('');
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    const oldCount = Number(await SecureStore.getItemAsync(`${key}.chunks`) || 0);
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    await SecureStore.setItemAsync(`${key}.chunks`, String(count));
    if (oldCount > count) for (let i = count; i < oldCount; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await SecureStore.deleteItemAsync(key);
  },
  async removeItem(key) {
    const count = Number(await SecureStore.getItemAsync(`${key}.chunks`) || 0);
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await SecureStore.deleteItemAsync(`${key}.chunks`);
    await SecureStore.deleteItemAsync(key);
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(url && key);
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key', {
  auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' },
});

// Refresh tokens only while the native app is active; Supabase persists the session between launches.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });
}
