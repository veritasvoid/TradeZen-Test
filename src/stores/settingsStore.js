import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export const useSettingsStore = create((set) => ({
  settings: DEFAULT_SETTINGS,
  
  // Update settings
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },

  // Toggle privacy mode
  togglePrivacyMode: () => {
    set((state) => ({
      settings: { ...state.settings, privacyMode: !state.settings.privacyMode }
    }));
  },

  // Get currency symbol
  getCurrencySymbol: () => {
    const state = useSettingsStore.getState();
    return state.settings.currency;
  }
}));
