// =============================================================================
// MMKV — persistent storage instances & zustand adapter
// Spec: 6.4, "MMKV вместо AsyncStorage"
// =============================================================================

import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

// Separate instances for data isolation
export const gameMMKV = new MMKV({ id: 'game-storage' });
export const settingsMMKV = new MMKV({ id: 'settings-storage' });
export const statsMMKV = new MMKV({ id: 'stats-storage' });

/**
 * Create a zustand-compatible StateStorage backed by an MMKV instance.
 * MMKV is synchronous — perfect match for persist middleware.
 */
export function createMMKVStorage(instance: MMKV): StateStorage {
  return {
    getItem: (name: string): string | null => {
      return instance.getString(name) ?? null;
    },
    setItem: (name: string, value: string): void => {
      instance.set(name, value);
    },
    removeItem: (name: string): void => {
      instance.delete(name);
    },
  };
}
