import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { AppHeader, Button, Card, Chip, LoadingOverlay, Screen } from '@/components/ui';
import { CAPTURE_CONFIG } from '@/data/copy';
import { featureFlags } from '@/config/featureFlags';
import { getVehicle } from '@/data/vehicleTypes';
import { ROUTES } from '@/navigation/routes';
import { useOpenCamera } from '@/navigation/useAppNavigation';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing } from '@/theme';
import type { RiderDocumentTarget } from '@/types/models';
import { jitteredSleep } from '@/utils/delay';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  typeof ROUTES.DOCUMENTS_REVIEW
>;

const DOCS: RiderDocumentTarget[] = ['license', 'nationalId', 'plate'];

export function DocumentsReviewScreen({ navigation }: Props) {
  const styles = useStyles();
  const documents = useAppStore((s) => s.documents);
  const submitRiderDocuments = useAppStore((s) => s.submitRiderDocuments);
  const openCamera = useOpenCamera();

  const [submitting, setSubmitting] = useState(false);

  const vehicle = documents.vehicleType ? getVehicle(documents.vehicleType) : null;
  const complete = DOCS.every((d) => documents[d]) && !!documents.vehicleType;

  const handleSubmit = async () => {
    setSubmitting(true);
    await jitteredSleep(featureFlags.FAKE_DELAY_MS);
    submitRiderDocuments();
    setSubmitting(false);
    // No navigation call — submitting flips verificationStatus to 'pending',
    // completing onboarding, and the root switch mounts the drawer.
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label="Submit for review"
          onPress={handleSubmit}
          disabled={!complete}
          loading={submitting}
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="Review your details"
        subtitle="Check everything is clear before submitting."
      />

      <View style={styles.list}>
        {DOCS.map((target) => {
          const asset = documents[target];
          const config = CAPTURE_CONFIG[target];

          return (
            <Card key={target} style={styles.row}>
              {asset ? (
                <Image source={{ uri: asset.uri }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]}>
                  <Text style={styles.thumbIcon}>📄</Text>
                </View>
              )}

              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{config.shortLabel}</Text>
                <Chip
                  label={asset ? 'Captured' : 'Missing'}
                  tone={asset ? 'success' : 'danger'}
                  dot
                />
              </View>

              <Pressable onPress={() => openCamera(target)} hitSlop={8}>
                <Text style={styles.retake}>{asset ? 'Retake' : 'Add'}</Text>
              </Pressable>
            </Card>
          );
        })}

        <Card style={styles.row}>
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Text style={styles.thumbIcon}>{vehicle?.emoji ?? '🚲'}</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Vehicle type</Text>
            <Chip
              label={vehicle ? `${vehicle.label} · ${vehicle.localName}` : 'Not selected'}
              tone={vehicle ? 'brand' : 'danger'}
            />
          </View>
          <Pressable onPress={() => navigation.navigate(ROUTES.VEHICLE_TYPE)} hitSlop={8}>
            <Text style={styles.retake}>Change</Text>
          </Pressable>
        </Card>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeIcon}>ℹ️</Text>
        <Text style={styles.noticeText}>
          An admin reviews rider documents before you can accept trips. This usually takes
          up to 24 hours.
        </Text>
      </View>

      <LoadingOverlay visible={submitting} message="Submitting your documents…" />
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbIcon: { fontSize: 22 },
  rowBody: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  rowTitle: { ...type.subheading, fontSize: 15 },
  retake: { ...type.subheading, fontSize: 14, color: colors.primary },
  notice: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.infoBg,
    borderRadius: radius.base,
  },
  noticeIcon: { fontSize: 14 },
  noticeText: { ...type.caption, flex: 1, lineHeight: 18 },
}));
