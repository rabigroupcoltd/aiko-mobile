import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  typeof ROUTES.LICENSE_CAPTURE
>;

const TIPS = [
  'Lay the licence flat on a dark surface.',
  'Make sure all four corners are inside the frame.',
  'Avoid glare — move away from direct light.',
];

export function LicenseCaptureScreen({ navigation }: Props) {
  const license = useAppStore((s) => s.documents.license);

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Continue"
          onPress={() => navigation.navigate(ROUTES.NATIONAL_ID)}
          disabled={!license}
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="Driver's licence"
        subtitle="Step 1 of 4 · Rider verification"
      />

      <CapturePrompt target="license" asset={license} tips={TIPS} />
    </Screen>
  );
}
