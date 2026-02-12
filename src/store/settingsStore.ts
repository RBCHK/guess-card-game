// =============================================================================
// Settings Store — sound, vibration, probabilities, language
// Spec: 7.5.4 (Settings screen)
// =============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createMMKVStorage, settingsMMKV } from '@/lib/storage/mmkv';

// ---------------------------------------------------------------------------

export type Language = 'ru' | 'en';

export interface SettingsState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showProbabilities: boolean;
  language: Language;
}

export interface SettingsActions {
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setShowProbabilities: (enabled: boolean) => void;
  setLanguage: (lang: Language) => void;
  resetSettings: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: SettingsState = {
  soundEnabled: true,
  vibrationEnabled: true,
  showProbabilities: false,
  language: 'ru',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
      setShowProbabilities: (enabled) => set({ showProbabilities: enabled }),
      setLanguage: (lang) => set({ language: lang }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => createMMKVStorage(settingsMMKV)),
      partialize: ({
        soundEnabled,
        vibrationEnabled,
        showProbabilities,
        language,
      }) => ({ soundEnabled, vibrationEnabled, showProbabilities, language }),
    },
  ),
);
