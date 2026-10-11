import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { RiderStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<RiderStackParamList, typeof ROUTES.NATIONAL_ID>;

const TIPS = [
  'Your NIN slip or national ID card both work.',
  'All text must be readable in the photo.',
  'Lay it flat — the scanner finds the edges and crops it for you.',
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
        subtitle="Step 2 of 5 · Rider verification"
      />

      <CapturePrompt target="nationalId" asset={nationalId} tips={TIPS} />
    </Screen>
  );
}
