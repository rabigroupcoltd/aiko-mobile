import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { RiderStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<RiderStackParamList, typeof ROUTES.PLATE_PHOTO>;

const TIPS = [
  'Stand close enough that the plate number is readable.',
  'Photograph the plate straight on, not at an angle.',
  'Clean off any mud or dust first.',
];

export function PlatePhotoScreen({ navigation }: Props) {
  const plate = useAppStore((s) => s.documents.plate);

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Continue"
          onPress={() => navigation.navigate(ROUTES.DOCUMENTS_REVIEW)}
          disabled={!plate}
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="Vehicle plate number"
        subtitle="Step 5 of 5 · Rider verification"
      />

      <CapturePrompt target="plate" asset={plate} tips={TIPS} />
    </Screen>
  );
}
