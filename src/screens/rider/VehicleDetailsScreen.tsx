import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen, TextField } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { RiderStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing } from '@/theme';

type Props = NativeStackScreenProps<RiderStackParamList, typeof ROUTES.VEHICLE_DETAILS>;

/** The makes most riders in Minna actually have — one tap instead of typing. */
const BRANDS: Record<'bike' | 'tricycle', string[]> = {
  bike: ['Bajaj', 'TVS', 'Honda', 'Qlink', 'Haojue', 'Suzuki'],
  tricycle: ['Bajaj', 'TVS', 'Piaggio', 'Lifan', 'Daylong'],
};

const TIPS = [
  'Stand back so the whole vehicle is in the photo.',
  'Make sure the plate is visible.',
  'Take it in daylight if you can.',
];

/**
 * Step 4: the vehicle itself — a photo, its brand and plate number.
 *
 * Every keystroke is saved to the device draft, so leaving the app or going
 * back to retake a photo never loses what was typed.
 */
export function VehicleDetailsScreen({ navigation }: Props) {
  const styles = useStyles();
  const photo = useAppStore((s) => s.documents.vehicle);
  const vehicleType = useAppStore((s) => s.documents.vehicleType) ?? 'bike';
  const details = useAppStore((s) => s.documents.vehicleDetails);
  const setDetails = useAppStore((s) => s.setVehicleDetails);
  const [touched, setTouched] = useState(false);

  const brand = details?.brand ?? '';
  const model = details?.model ?? '';
  const plate = details?.plate ?? '';
  const color = details?.color ?? '';

  const errors = {
    photo: photo ? undefined : 'Take a photo of your vehicle',
    brand: brand.trim().length >= 2 ? undefined : 'Choose or type your vehicle brand',
    plate: plate.trim().length >= 3 ? undefined : 'Enter the number on your plate',
  };
  const ready = !errors.photo && !errors.brand && !errors.plate;

  const handleContinue = () => {
    setTouched(true);
    if (ready) navigation.navigate(ROUTES.PLATE_PHOTO);
  };

  return (
    <Screen scroll footer={<Button label="Continue" onPress={handleContinue} />}>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="Your vehicle"
        subtitle="Step 4 of 5 · Rider verification"
      />

      <CapturePrompt target="vehicle" asset={photo} tips={TIPS} />
      {touched && errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}

      <Text style={styles.section}>Brand</Text>
      <View style={styles.chips}>
        {BRANDS[vehicleType].map((name) => {
          const selected = brand.trim().toLowerCase() === name.toLowerCase();
          return (
            <Pressable
              key={name}
              onPress={() => setDetails({ brand: name })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.form}>
        <TextField
          label="Brand"
          value={brand}
          onChangeText={(value) => setDetails({ brand: value })}
          placeholder="Or type it, e.g. Bajaj"
          autoCapitalize="words"
          maxLength={60}
          error={touched ? errors.brand : undefined}
        />
        <TextField
          label="Model (optional)"
          value={model}
          onChangeText={(value) => setDetails({ model: value })}
          placeholder={vehicleType === 'tricycle' ? 'e.g. RE' : 'e.g. Boxer'}
          autoCapitalize="words"
          maxLength={100}
        />
        <TextField
          label="Plate number"
          value={plate}
          onChangeText={(value) => setDetails({ plate: value.toUpperCase() })}
          placeholder="e.g. MNA-123-XY"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
          error={touched ? errors.plate : undefined}
        />
        <TextField
          label="Colour (optional)"
          value={color}
          onChangeText={(value) => setDetails({ color: value })}
          placeholder="e.g. Red"
          autoCapitalize="words"
          maxLength={40}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  section: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  chipText: { ...type.bodySmall, color: colors.text, fontWeight: '600' },
  chipTextSelected: { color: colors.primary },
  form: { gap: spacing.xs },
  error: { ...type.caption, color: colors.danger, marginTop: spacing.sm },
}));
