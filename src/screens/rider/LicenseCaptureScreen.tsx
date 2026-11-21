import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen } from '@/components/ui';
import { useSwitchMode } from '@/hooks/useSwitchMode';
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
  'Avoid glare — move away from direct light.',
];

export function LicenseCaptureScreen({ navigation }: Props) {
  const license = useAppStore((s) => s.documents.license);
  const { switchTo, switching } = useSwitchMode();

  // The first rider step: backing out returns to ordering rather than nowhere.
  const leave = () => (navigation.canGoBack() ? navigation.goBack() : void switchTo('PASSENGER'));

  return (
    <Screen
      scroll
      footer={
        <View style={{ gap: 4 }}>
          <Button
            label="Continue"
            onPress={() => navigation.navigate(ROUTES.NATIONAL_ID)}
            disabled={!license}
          />
          <Button
            label="Not now — back to ordering"
            variant="ghost"
            size="md"
            loading={switching}
            onPress={() => void switchTo('PASSENGER')}
          />
        </View>
      }>
      <AppHeader
        onBack={leave}
        title="Driver's licence"
        subtitle="Step 1 of 5 · Rider verification"
      />

      <CapturePrompt target="license" asset={license} tips={TIPS} />
    </Screen>
  );
}
