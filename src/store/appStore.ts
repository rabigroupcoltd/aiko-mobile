import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CaptureTarget, DocumentAsset, GoogleAccount, VehicleType } from '@/types/models';
import { deleteAsset, persistCapture } from '@/utils/fileStore';

export const STORAGE_KEY = 'aiko-app-v1';

/** What the rider types about their vehicle, kept as they type so nothing is lost. */
export interface VehicleDetailsDraft {
  brand: string;
  model: string;
  plate: string;
  color: string;
}

interface Documents {
  license?: DocumentAsset;
  nationalId?: DocumentAsset;
  vehicle?: DocumentAsset;
  plate?: DocumentAsset;
  vehicleType?: VehicleType;
  vehicleDetails?: VehicleDetailsDraft;
}

/**
 * Local scratch state — never the source of truth for who is signed in or how
 * far onboarding has gone. That lives server-side and is read through
 * `authStore`/`useOnboardingState`; see RootNavigator.
 *
 * What actually belongs here: captures in progress before they are uploaded
 * (a photo just taken, a rider document mid-review) and small per-device UI
 * preferences (settings, the Google account used to pre-fill a form). None of
 * it is safe to gate navigation on, because none of it is verified against
 * the server — it is exactly the kind of state a second device, a reinstall,
 * or an admin action on the backend would leave stale.
 */
interface AppState {
  /** False until AsyncStorage rehydration finishes. Deliberately NOT persisted. */
  _hasHydrated: boolean;

  /** Set when the user came in via Google; pre-fills the profile form. */
  googleAccount: GoogleAccount | null;
  photos: { profile?: DocumentAsset };
  documents: Documents;
  settings: { pushEnabled: boolean; smsEnabled: boolean };

  // ── actions ──────────────────────────────────────────────────────────────
  setHasHydrated: (v: boolean) => void;
  setGoogleAccount: (account: GoogleAccount) => void;
  setAsset: (
    target: CaptureTarget,
    capture: { uri: string; width: number; height: number }
  ) => Promise<void>;
  setVehicleType: (v: VehicleType) => void;
  setVehicleDetails: (patch: Partial<VehicleDetailsDraft>) => void;
  updateSettings: (patch: Partial<AppState['settings']>) => void;
  /**
   * Wipes every draft. Called on sign-out (see `useLogoutManager`) so a
   * second account signing in on the same device never inherits the first
   * one's half-finished capture — a license photo or a chosen vehicle type
   * left over would otherwise silently attach itself to whoever signs in next.
   */
  clearLocalDrafts: () => void;
}

const initialState = {
  _hasHydrated: false,
  googleAccount: null,
  photos: {},
  documents: {},
  settings: { pushEnabled: true, smsEnabled: true },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      setGoogleAccount: (account) => set({ googleAccount: account }),

      /**
       * Copies the capture out of the evictable cache directory before storing
       * its URI, and removes the file it replaces so re-captures don't pile up.
       */
      setAsset: async (target, capture) => {
        const uri = await persistCapture(capture.uri, target);
        const asset: DocumentAsset = {
          uri,
          capturedAt: new Date().toISOString(),
          target,
          width: capture.width,
          height: capture.height,
        };

        const state = get();
        const previous =
          target === 'profile' ? state.photos.profile : state.documents[target];

        if (target === 'profile') {
          set({ photos: { ...state.photos, profile: asset } });
        } else {
          set({ documents: { ...state.documents, [target]: asset } });
        }

        // Delete after the new asset is committed — losing the old file matters
        // far less than losing the new one if this throws.
        deleteAsset(previous?.uri);
      },

      setVehicleType: (v) =>
        set({ documents: { ...get().documents, vehicleType: v } }),

      setVehicleDetails: (patch) => {
        const documents = get().documents;
        const current = documents.vehicleDetails ?? { brand: '', model: '', plate: '', color: '' };
        set({ documents: { ...documents, vehicleDetails: { ...current, ...patch } } });
      },

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

      clearLocalDrafts: () => set({ ...initialState, _hasHydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),

      // _hasHydrated must never round-trip: a persisted `true` would be applied
      // on the NEXT boot before rehydration finished, defeating the whole gate.
      partialize: (s) => ({
        googleAccount: s.googleAccount,
        photos: s.photos,
        documents: s.documents,
        settings: s.settings,
      }),

      onRehydrateStorage: () => () => {
        useAppStore.setState({ _hasHydrated: true });
      },
    }
  )
);
