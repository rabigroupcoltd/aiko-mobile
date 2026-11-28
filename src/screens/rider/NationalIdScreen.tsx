import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen } from '@/components/ui';
import { useSwitchMode } from '@/hooks/useSwitchMode';
import { ROUTES } from '@/navigation/routes';
import type { RiderStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<RiderStackParamList, typeof ROUTES.NATIONAL_ID>;

const TIPS = [
  'Your NIN slip (old or new) or National ID card both work.',
  'Lay it flat on a dark surface — the scanner finds the edges and crops it for you.',
  'Every word must be readable. Move out of direct sun to avoid glare.',
];

export function NationalIdScreen({ navigation }: Props) {
  const nationalId = useAppStore((s) => s.documents.nationalId);
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
            onPress={() => navigation.navigate(ROUTES.LICENSE_CAPTURE)}
            disabled={!nationalId}
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
        title="National ID"
        subtitle="Step 1 of 5 · Rider verification"
      />

      <CapturePrompt target="nationalId" asset={nationalId} tips={TIPS} />
    </Screen>
  );
}
