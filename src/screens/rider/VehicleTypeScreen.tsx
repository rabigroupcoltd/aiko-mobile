import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';

import { AppHeader, Button, Screen, SelectableCard } from '@/components/ui';
import { VEHICLE_TYPES } from '@/data/vehicleTypes';
import { ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { makeStyles, spacing } from '@/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.VEHICLE_TYPE>;

export function VehicleTypeScreen({ navigation }: Props) {
  const styles = useStyles();
  const vehicleType = useAppStore((s) => s.documents.vehicleType);
  const setVehicleType = useAppStore((s) => s.setVehicleType);

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Continue"
          onPress={() => navigation.navigate(ROUTES.PLATE_PHOTO)}
          disabled={!vehicleType}
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="What do you ride?"
        subtitle="Step 3 of 4 · Rider verification"
      />

      <View style={styles.cards}>
        {VEHICLE_TYPES.map((v) => (
          <SelectableCard
            key={v.id}
            icon={v.emoji}
            title={`${v.label} · ${v.localName}`}
            description={v.description}
            meta={v.capacity}
            selected={vehicleType === v.id}
            onPress={() => setVehicleType(v.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  cards: { gap: spacing.md },
}));
