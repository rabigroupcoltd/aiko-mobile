import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  AuthMethod,
  CaptureTarget,
  DocumentAsset,
  GoogleAccount,
  Role,
  UserProfile,
  VehicleType,
  VerificationStatus,
} from '@/types/models';
import { makeId } from '@/utils/id';
import { clearAllAssets, deleteAsset, persistCapture } from '@/utils/fileStore';
import { createLogger } from '@/utils/logger';
import { toE164 } from '@/utils/phone';

const log = createLogger('appStore');

export const STORAGE_KEY = 'aiko-app-v1';

/** Breadcrumb for the progress indicator only — never the source of routing truth. */
export type OnboardingStep =
  | 'phone'
  | 'otp'
  | 'profile'
  | 'photo'
  | 'liveness'
  | 'userType'
  | 'riderDocs'
  | 'done';

interface Documents {
  license?: DocumentAsset;
  nationalId?: DocumentAsset;
  plate?: DocumentAsset;
  vehicleType?: VehicleType;
}

interface AppState {
  /** False until AsyncStorage rehydration finishes. Deliberately NOT persisted. */
  _hasHydrated: boolean;

  user: UserProfile | null;
  /** The number entered on the phone screen, held until OTP confirms it. */
  pendingPhone: string | null;
  /**
   * A number the user typed. True as soon as one is on file, however it got
   * there — this is what lets someone past the auth stack.
   */
  phoneProvided: boolean;
  /**
   * A number confirmed by an SMS code. Strictly stronger than `phoneProvided`
   * and never set without a real OTP round-trip, so anything that actually
   * depends on reachability (rider payouts, a verified badge) must read THIS.
   * With featureFlags.REQUIRE_OTP off it stays false for everyone.
   */
  phoneVerified: boolean;
  /** Set when the user came in via Google; pre-fills the profile form. */
  googleAccount: GoogleAccount | null;
  authMethod: AuthMethod;
  role: Role | null;
  verificationStatus: VerificationStatus;
  livenessPassed: boolean;
  livenessAt: string | null;
  onboardingStep: OnboardingStep;
  photos: { profile?: DocumentAsset };
  documents: Documents;
  settings: { pushEnabled: boolean; smsEnabled: boolean };

  // ── actions ──────────────────────────────────────────────────────────────
  setHasHydrated: (v: boolean) => void;
  setPendingPhone: (phone: string) => void;
  acceptPhoneUnverified: (phone: string) => void;
  confirmOtp: () => void;
  setGoogleAccount: (account: GoogleAccount) => void;
  clearGoogleAccount: () => void;
      saveProfile: (p: {
    email: string;
    firstName: string;
    lastName: string;
    dob: string;
  }) => void;
  setAsset: (
    target: CaptureTarget,
    capture: { uri: string; width: number; height: number }
  ) => Promise<void>;
  setLivenessPassed: (v: boolean) => void;
  setRole: (role: Role) => void;
  setVehicleType: (v: VehicleType) => void;
  submitRiderDocuments: () => void;
  setVerificationStatus: (s: VerificationStatus) => void;
  setOnboardingStep: (s: OnboardingStep) => void;
  updateSettings: (patch: Partial<AppState['settings']>) => void;
  logout: () => void;
  resetDemo: () => Promise<void>;
}

const initialState = {
  _hasHydrated: false,
  user: null,
  pendingPhone: null,
  phoneProvided: false,
  phoneVerified: false,
  googleAccount: null,
  authMethod: 'phone' as AuthMethod,
  role: null,
  verificationStatus: 'none' as VerificationStatus,
  livenessPassed: false,
  livenessAt: null,
  onboardingStep: 'phone' as OnboardingStep,
  photos: {},
  documents: {},
  settings: { pushEnabled: true, smsEnabled: true },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      setPendingPhone: (phone) =>
        set({ pendingPhone: toE164(phone), onboardingStep: 'otp' }),

      /**
       * Records a number we never sent a code to — the launch flow, where Google
       * establishes identity and the number is only a way to reach the user.
       *
       * Deliberately does NOT touch `phoneVerified`. Setting it here would be
       * one line shorter and would quietly make every future reader of that flag
       * wrong.
       */
      acceptPhoneUnverified: (phone) =>
        set({
          pendingPhone: toE164(phone),
          phoneProvided: true,
          onboardingStep: 'profile',
        }),

      confirmOtp: () =>
        set({ phoneProvided: true, phoneVerified: true, onboardingStep: 'profile' }),

      /**
       * Google identity is accepted for the account, but the user still has to
       * verify a phone number — a dispatch app needs a reachable number for the
       * rider, and Google doesn't supply one.
       */
      setGoogleAccount: (account) =>
        set({ googleAccount: account, authMethod: 'google' }),

      clearGoogleAccount: () => set({ googleAccount: null, authMethod: 'phone' }),

      saveProfile: ({ email, firstName, lastName, dob }) => {
        const existing = get().user;
        set({
          user: {
            id: existing?.id ?? makeId('usr'),
            phone: existing?.phone ?? get().pendingPhone ?? '',
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            email,
            firstName,
            lastName,
            dob,
          },
          onboardingStep: 'photo',
        });
      },

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

      setLivenessPassed: (v) =>
        set({
          livenessPassed: v,
          livenessAt: v ? new Date().toISOString() : null,
          ...(v ? { onboardingStep: 'userType' as OnboardingStep } : {}),
        }),

      setRole: (role) =>
        set({
          role,
          onboardingStep: role === 'rider' ? 'riderDocs' : 'done',
          // Passengers need no approval; riders start unverified.
          verificationStatus:
            role === 'passenger' ? 'approved' : get().verificationStatus,
        }),

      setVehicleType: (v) =>
        set({ documents: { ...get().documents, vehicleType: v } }),

      submitRiderDocuments: () =>
        set({ verificationStatus: 'pending', onboardingStep: 'done' }),

      setVerificationStatus: (s) => set({ verificationStatus: s }),

      setOnboardingStep: (s) => set({ onboardingStep: s }),

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

      /** Ends the session but keeps captured files — used by the drawer. */
      logout: () =>
        set({
          ...initialState,
          _hasHydrated: true,
        }),

      /** DEV: wipe everything, including photos on disk. */
      resetDemo: async () => {
        clearAllAssets();
        set({ ...initialState, _hasHydrated: true });
        await AsyncStorage.removeItem(STORAGE_KEY);
        log.info('demo reset');
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),

      // _hasHydrated must never round-trip: a persisted `true` would be applied
      // on the NEXT boot before rehydration finished, defeating the whole gate.
      partialize: (s) => ({
        user: s.user,
        pendingPhone: s.pendingPhone,
        phoneProvided: s.phoneProvided,
        phoneVerified: s.phoneVerified,
        googleAccount: s.googleAccount,
        authMethod: s.authMethod,
        role: s.role,
        verificationStatus: s.verificationStatus,
        livenessPassed: s.livenessPassed,
        livenessAt: s.livenessAt,
        onboardingStep: s.onboardingStep,
        photos: s.photos,
        documents: s.documents,
        settings: s.settings,
      }),

      onRehydrateStorage: () => (_state, error) => {
        if (error) log.warn('rehydrate failed', error);
        // Set on BOTH paths. A corrupt payload must not strand the app on the
        // splash screen forever.
        useAppStore.setState({ _hasHydrated: true });
      },
    }
  )
);
