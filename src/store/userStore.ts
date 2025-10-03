import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    screenReader: boolean;
  };
}

interface UserState {
  preferences: UserPreferences;
  recentSearches: string[];
  favoriteSpecialists: string[];
  
  // Actions
  setLanguage: (language: string) => void;
  setTheme: (theme: UserPreferences['theme']) => void;
  updateNotificationPreferences: (notifications: Partial<UserPreferences['notifications']>) => void;
  updateAccessibilityPreferences: (accessibility: Partial<UserPreferences['accessibility']>) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
  toggleFavoriteSpecialist: (specialistId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: {
        language: 'en',
        theme: 'system',
        notifications: {
          email: true,
          sms: false,
          whatsapp: false,
          push: true,
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          screenReader: false,
        },
      },
      recentSearches: [],
      favoriteSpecialists: [],

      setLanguage: (language) =>
        set((state) => ({
          preferences: { ...state.preferences, language },
        })),

      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme },
        })),

      updateNotificationPreferences: (notifications) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            notifications: { ...state.preferences.notifications, ...notifications },
          },
        })),

      updateAccessibilityPreferences: (accessibility) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            accessibility: { ...state.preferences.accessibility, ...accessibility },
          },
        })),

      addRecentSearch: (search) =>
        set((state) => ({
          recentSearches: [search, ...state.recentSearches.filter((s) => s !== search)].slice(0, 10),
        })),

      clearRecentSearches: () => set({ recentSearches: [] }),

      toggleFavoriteSpecialist: (specialistId) =>
        set((state) => ({
          favoriteSpecialists: state.favoriteSpecialists.includes(specialistId)
            ? state.favoriteSpecialists.filter((id) => id !== specialistId)
            : [...state.favoriteSpecialists, specialistId],
        })),
    }),
    {
      name: 'user-storage',
    }
  )
);
