import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen, StepDots } from '@/components/ui';
import {
  UploadOnboardingPhotoManager,
  useOnboardingState,
} from '@/modules/onboarding/onboardingController';
import { onboardingStepRoute, ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { ONBOARDING_TOTAL_STEPS } from '@/store/selectors';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  typeof ROUTES.PROFILE_PHOTO
>;

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

const TIPS = [
  'Face the camera directly in good light.',
  'No sunglasses, hats or face coverings.',
  'Only you should be in the photo.',
];

export function ProfilePhotoScreen({ navigation }: Props) {
  const photo = useAppStore((s) => s.photos.profile);
  const savedOnServer = useOnboardingState()?.requirements.photo ?? false;
  const { uploadPhoto } = UploadOnboardingPhotoManager();
  const [uploading, setUploading] = useState(false);

  const handleContinue = async () => {
    if (!photo) {
      if (savedOnServer) navigation.navigate(ROUTES.LIVENESS);
      return;
    }

    const ext = photo.uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
    const known = ext in MIME_BY_EXT;

    setUploading(true);
    try {
      const state = await uploadPhoto({
        uri: photo.uri,
        name: `profile-${Date.now()}.${known ? ext : 'jpg'}`,
        type: known ? MIME_BY_EXT[ext] : 'image/jpeg',
      });
      const next = onboardingStepRoute(state.resumeStep);
      if (next && next !== ROUTES.PROFILE_PHOTO) navigation.navigate(next);
    } catch {
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!photo && !savedOnServer}
          loading={uploading}
        />
      }>
      <AppHeader
        onBack={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.navigate(ROUTES.PROFILE_FORM)
        }
        title="Add a profile photo"
        subtitle="Riders and passengers use this to recognise each other."
        trailing={<StepDots total={ONBOARDING_TOTAL_STEPS} current={1} />}
      />

      <CapturePrompt target="profile" asset={photo} tips={TIPS} />
    </Screen>
  );
}
