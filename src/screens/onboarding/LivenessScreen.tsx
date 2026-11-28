import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { SelfieCapture } from '@/components/liveness/SelfieCapture';
import {
  UpdateOnboardingManager,
  UploadOnboardingPhotoManager,
} from '@/modules/onboarding/onboardingController';
import { onboardingStepRoute, ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.LIVENESS>;

/**
 * The onboarding selfie: a blink or nod proves a real person is there, and the
 * photo taken right after becomes the profile photo.
 */
export function LivenessScreen({ navigation }: Props) {
  const { updateOnboarding } = UpdateOnboardingManager();
  const { uploadPhoto } = UploadOnboardingPhotoManager();
  const setAsset = useAppStore((s) => s.setAsset);

  const save = useCallback(
    async (uri: string) => {
      await uploadPhoto({ uri, name: `selfie-${Date.now()}.jpg`, type: 'image/jpeg' });
      const state = await updateOnboarding({ livenessPassed: true });
      await setAsset('profile', { uri, width: 0, height: 0 }).catch(() => undefined);

      const next = onboardingStepRoute(state.resumeStep);
      if (next && next !== ROUTES.LIVENESS) navigation.navigate(next);
    },
    [navigation, setAsset, updateOnboarding, uploadPhoto],
  );

  return (
    <SelfieCapture
      confirmLabel="Use this photo"
      onConfirm={save}
      onBack={() =>
        navigation.canGoBack() ? navigation.goBack() : navigation.navigate(ROUTES.PROFILE_FORM)
      }
    />
  );
}
