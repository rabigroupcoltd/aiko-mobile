import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { RiderStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<
  RiderStackParamList,
  typeof ROUTES.LICENSE_CAPTURE
>;

const TIPS = [
  'Lay the licence flat on a dark surface.',
  'The scanner finds the edges and crops it for you — drag a corner if it misses.',
  'Avoid glare — move out of direct sun.',
];

export function LicenseCaptureScreen({ navigation }: Props) {
  const license = useAppStore((s) => s.documents.license);
  const next = () => navigation.navigate(ROUTES.VEHICLE_TYPE);

  return (
    <Screen
      scroll
      footer={
        // Optional: plenty of riders don't have one, and that's fine.
        <Button
          label={license ? 'Continue' : "I don't have one — skip"}
          variant={license ? 'primary' : 'secondary'}
          onPress={next}
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="Driver's licence"
        subtitle="Step 2 of 5 · Optional — skip it if you don't have one"
      />

      <CapturePrompt target="license" asset={license} tips={TIPS} />
    </Screen>
  );
}
