import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CapturePrompt } from '@/components/camera/CapturePrompt';
import { AppHeader, Button, Screen, TextField } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { RiderStackParamList } from '@/navigation/types';
import {
  isPlausiblePlate,
  looksLikeNigerianPlate,
  normalisePlate,
  recognisePlate,
} from '@/services/plateRecognition';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing } from '@/theme';

type Props = NativeStackScreenProps<RiderStackParamList, typeof ROUTES.PLATE_PHOTO>;

const TIPS = [
  'Point the camera at the plate — the scanner finds its edges and crops it.',
  'Get close enough that every character is sharp. Drag a corner if it misses.',
  'Wipe off mud or dust, and avoid glare from direct sun.',
];

export function PlatePhotoScreen({ navigation }: Props) {
  const styles = useStyles();
  const plate = useAppStore((s) => s.documents.plate);
  const plateNumber = useAppStore((s) => s.documents.vehicleDetails?.plate ?? '');
  const setDetails = useAppStore((s) => s.setVehicleDetails);

  const [touched, setTouched] = useState(false);
  const [reading, setReading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Each new scan gets one OCR pass. The result is only offered, never
  // applied silently: the rider confirms what the plate actually says.
  useEffect(() => {
    if (!plate?.uri) return;
    let cancelled = false;
    setSuggestion(null);
    setReading(true);
    void recognisePlate(plate.uri).then((found) => {
      if (cancelled) return;
      setReading(false);
      if (found && found !== normalisePlate(plateNumber)) setSuggestion(found);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per captured image
  }, [plate?.uri]);

  const errors = {
    photo: plate ? undefined : 'Scan your plate number',
    number: isPlausiblePlate(plateNumber)
      ? undefined
      : 'Enter the registration number exactly as it appears on the plate',
  };
  const ready = !errors.photo && !errors.number;
  const unusualFormat = !errors.number && !looksLikeNigerianPlate(plateNumber);

  const handleContinue = () => {
    setTouched(true);
    if (!ready) return;
    setDetails({ plate: normalisePlate(plateNumber) });
    navigation.navigate(ROUTES.DOCUMENTS_REVIEW);
  };

  return (
    <Screen scroll keyboardAvoiding footer={<Button label="Continue" onPress={handleContinue} />}>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="Vehicle plate number"
        subtitle="Step 5 of 5 · Rider verification"
      />

      <CapturePrompt target="plate" asset={plate} tips={plate ? undefined : TIPS} />
      {touched && errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}

      {plate ? (
        <View style={styles.verify}>
          <Text style={styles.verifyTitle}>Check the registration number</Text>
          <Text style={styles.verifyBody}>
            Compare it with the scan above, character by character. Our team checks it against
            the plate before you&apos;re approved.
          </Text>

          {suggestion ? (
            <Pressable
              onPress={() => {
                setDetails({ plate: suggestion });
                setSuggestion(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Use ${suggestion}, read from the scan`}
              style={styles.suggestion}>
              <Text style={styles.suggestionLabel}>Read from the scan</Text>
              <Text style={styles.suggestionValue}>{suggestion}</Text>
              <Text style={styles.suggestionAction}>Use this</Text>
            </Pressable>
          ) : null}

          <TextField
            label="Registration number"
            value={plateNumber}
            onChangeText={(value) => setDetails({ plate: value.toUpperCase() })}
            onBlur={() => plateNumber && setDetails({ plate: normalisePlate(plateNumber) })}
            placeholder={reading ? 'Reading the plate…' : 'e.g. MNA-123-XY'}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            error={touched ? errors.number : undefined}
            helper={
              unusualFormat
                ? "That isn't the usual ABC-123-DE layout — double-check it against the plate."
                : undefined
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  error: { ...type.caption, color: colors.danger, marginTop: spacing.sm },
  verify: { marginTop: spacing.xl, gap: spacing.sm },
  verifyTitle: type.heading,
  verifyBody: { ...type.bodySmall, marginBottom: spacing.xs },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.base,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  suggestionLabel: { ...type.caption, flex: 1 },
  suggestionValue: { ...type.subheading, fontSize: 16, letterSpacing: 1 },
  suggestionAction: { ...type.subheading, fontSize: 14, color: colors.primary },
}));
