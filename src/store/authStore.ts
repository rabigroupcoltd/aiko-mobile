import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser } from '@/modules/auth/authTypes';
import type { OnboardingState } from '@/modules/onboarding/onboardingTypes';

export const AUTH_STORAGE_KEY = 'aiko-auth-v1';

/**
 * Server session: the bearer token, who it belongs to, and where onboarding
 * left off.
 *
 * Deliberately separate from `appStore`, which holds local demo state. The
 * request interceptor reads this synchronously via `getState()`, so it must not
 * be entangled with anything that re-renders.
 */
interface AuthState {
  /** False until AsyncStorage rehydration finishes. Never persisted. */
  _hasHydrated: boolean;

  accessToken: string | null;
  user: AuthUser | null;
  /** Last known onboarding state, refreshed on every sign-in. */
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

      // `_hasHydrated` must never round-trip: a persisted `true` would be
      // applied on the next boot before rehydration finished, defeating the gate.
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        onboarding: state.onboarding,
      }),

      // Set on both paths — a corrupt payload must not strand the app.
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

/** Synchronous token read for the axios interceptor. */
export const getAccessToken = (): string | null => useAuthStore.getState().accessToken;
