import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser } from '@/modules/auth/authTypes';
import type { OnboardingState } from '@/modules/onboarding/onboardingTypes';

export const AUTH_STORAGE_KEY = 'aiko-auth-v1';

interface AuthState {
  _hasHydrated: boolean;

  accessToken: string | null;
  user: AuthUser | null;
  onboarding: OnboardingState | null;

  setSession: (session: {
    accessToken: string;
    user: AuthUser;
    onboarding?: OnboardingState | null;
  }) => void;
  setUser: (user: AuthUser) => void;
  setOnboarding: (onboarding: OnboardingState) => void;
  setHasHydrated: (value: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      accessToken: null,
      user: null,
      onboarding: null,

      setSession: ({ accessToken, user, onboarding }) =>
        set({ accessToken, user, onboarding: onboarding ?? null }),

      setUser: (user) => set({ user }),
      setOnboarding: (onboarding) => set({ onboarding }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      clearSession: () => set({ accessToken: null, user: null, onboarding: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        onboarding: state.onboarding,
      }),

      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

export const getAccessToken = (): string | null => useAuthStore.getState().accessToken;
