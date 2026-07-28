import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen, StepDots } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { ONBOARDING_TOTAL_STEPS } from '@/store/selectors';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  typeof ROUTES.PROFILE_PHOTO
>;

const TIPS = [
  'Face the camera directly in good light.',
  'No sunglasses, hats or face coverings.',
  'Only you should be in the photo.',
];

export function ProfilePhotoScreen({ navigation }: Props) {
  // Reads reactively from the store, so the photo appears as soon as the
  // capture modal dismisses — no callback plumbing through route params.
  const photo = useAppStore((s) => s.photos.profile);

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Continue"
          onPress={() => navigation.navigate(ROUTES.LIVENESS)}
          disabled={!photo}
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="Add a profile photo"
        subtitle="Riders and passengers use this to recognise each other."
        trailing={<StepDots total={ONBOARDING_TOTAL_STEPS} current={1} />}
      />

      <CapturePrompt target="profile" asset={photo} tips={TIPS} />
    </Screen>
  );
}
