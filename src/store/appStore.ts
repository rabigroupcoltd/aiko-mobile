import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CaptureTarget, DocumentAsset, GoogleAccount, VehicleType } from '@/types/models';
import { deleteAsset, persistCapture } from '@/utils/fileStore';

export const STORAGE_KEY = 'aiko-app-v1';

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

interface AppState {
  _hasHydrated: boolean;

  googleAccount: GoogleAccount | null;
  photos: { profile?: DocumentAsset };
  documents: Documents;
  settings: { pushEnabled: boolean; smsEnabled: boolean };

  setHasHydrated: (v: boolean) => void;
  setGoogleAccount: (account: GoogleAccount) => void;
  setAsset: (
    target: CaptureTarget,
    capture: { uri: string; width: number; height: number }
  ) => Promise<void>;
  setVehicleType: (v: VehicleType) => void;
  setVehicleDetails: (patch: Partial<VehicleDetailsDraft>) => void;
  updateSettings: (patch: Partial<AppState['settings']>) => void;
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
