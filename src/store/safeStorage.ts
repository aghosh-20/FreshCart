import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';

/**
 * AsyncStorage adapter for zustand persist. Read, write and parse failures are logged and
 * swallowed so a storage problem never crashes the app; the app starts with empty state.
 */
export function createSafeStorage<S>(): PersistStorage<S> {
  return {
    getItem: async (name) => {
      try {
        const raw = await AsyncStorage.getItem(name);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        console.warn(`[storage] Could not read "${name}"`, error);
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await AsyncStorage.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.warn(`[storage] Could not save "${name}"`, error);
      }
    },
    removeItem: async (name) => {
      try {
        await AsyncStorage.removeItem(name);
      } catch (error) {
        console.warn(`[storage] Could not remove "${name}"`, error);
      }
    },
  };
}
