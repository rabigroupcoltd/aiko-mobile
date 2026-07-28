import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.NATIONAL_ID>;

const TIPS = [
  'Your NIN slip or national ID card both work.',
  'All text must be readable in the photo.',
  'Keep the whole document inside the frame.',
];

export function NationalIdScreen({ navigation }: Props) {
  const nationalId = useAppStore((s) => s.documents.nationalId);

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Continue"
          onPress={() => navigation.navigate(ROUTES.VEHICLE_TYPE)}
          disabled={!nationalId}
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="National ID"
        subtitle="Step 2 of 4 · Rider verification"
      />

      <CapturePrompt target="nationalId" asset={nationalId} tips={TIPS} />
    </Screen>
  );
}
