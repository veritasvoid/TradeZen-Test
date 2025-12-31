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

  // Get currency symbol
  getCurrencySymbol: () => {
    const state = useSettingsStore.getState();
    return state.settings.currency;
  }
}));
