import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { AppHeader, Button, Card, Chip, Screen } from '@/components/ui';
import { CAPTURE_CONFIG } from '@/data/copy';
import { getVehicle, toApiVehicleType } from '@/data/vehicleTypes';
import { RegisterDriverManager } from '@/modules/drivers/driversController';
import type { UploadFile } from '@/modules/drivers/driversTypes';
import { useOnboardingState } from '@/modules/onboarding/onboardingController';
import { ROUTES } from '@/navigation/routes';
import { useOpenCamera } from '@/navigation/useAppNavigation';
import type { RiderStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing } from '@/theme';
import type { DocumentAsset, RiderDocumentTarget } from '@/types/models';

type Props = NativeStackScreenProps<
  RiderStackParamList,
  typeof ROUTES.DOCUMENTS_REVIEW
>;

const DOCS: RiderDocumentTarget[] = ['license', 'nationalId', 'vehicle', 'plate'];

/** How each capture is labelled on the server, so the admin sees what is what. */
const PHOTO_TYPE: Record<RiderDocumentTarget, string> = {
  license: 'DRIVER_LICENSE',
  nationalId: 'NATIONAL_ID',
  vehicle: 'FRONT',
  plate: 'PLATE_NUMBER',
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

function toUpload(target: RiderDocumentTarget, asset: DocumentAsset): UploadFile {
  const ext = asset.uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
  const known = ext in MIME_BY_EXT;
  return {
    uri: asset.uri,
    name: `${target}-${Date.now()}.${known ? ext : 'jpg'}`,
    type: known ? MIME_BY_EXT[ext] : 'image/jpeg',
  };
}

/**
 * The last rider step: everything captured, at a glance, then submit.
 *
 * Submitting registers the vehicle (`POST /drivers/register`), which creates
 * the driver profile an admin approves — the account moves to PENDING and
 * RiderStack swaps this screen for the waiting screen on its own. A rejected
 * rider lands back here and the same call resubmits.
 */
export function DocumentsReviewScreen({ navigation }: Props) {
  const styles = useStyles();
  const documents = useAppStore((s) => s.documents);
  const openCamera = useOpenCamera();
  const onboarding = useOnboardingState();
  const rejectionReason =
    onboarding?.driver.status === 'REJECTED' ? onboarding.driver.rejectionReason : null;

  const { registerDriver, isLoading } = RegisterDriverManager();
  const [touched, setTouched] = useState(false);

  const vehicle = documents.vehicleType ? getVehicle(documents.vehicleType) : null;
  const details = documents.vehicleDetails;
  const missingDocs = DOCS.filter((target) => !documents[target]);
  const detailsMissing = !details?.brand?.trim() || (details?.plate?.trim().length ?? 0) < 3;
  const ready = missingDocs.length === 0 && Boolean(vehicle) && !detailsMissing;

  const handleSubmit = async () => {
    setTouched(true);
    if (!ready || !documents.vehicleType || !details) return;

    const captured = DOCS.map((target) => [target, documents[target]!] as const);

    try {
      await registerDriver({
        vehicleType: toApiVehicleType(documents.vehicleType),
        vehiclePlate: details.plate.trim().toUpperCase(),
        vehicleBrand: details.brand.trim(),
        ...(details.model.trim() ? { vehicleModel: details.model.trim() } : {}),
        ...(details.color.trim() ? { vehicleColor: details.color.trim() } : {}),
        photoTypes: captured.map(([target]) => PHOTO_TYPE[target]).join(','),
        photos: captured.map(([target, asset]) => toUpload(target, asset)),
      });
      // No navigation: the onboarding refetch flips RiderStack to the
      // waiting screen.
    } catch {
      // useApiManager has already shown the reason.
    }
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label={rejectionReason ? 'Resubmit for review' : 'Submit for review'}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="Review and submit"
        subtitle="Check everything before it goes to our team."
      />

      {rejectionReason ? (
        <View style={styles.rejected}>
          <Text style={styles.rejectedTitle}>Your last submission was not approved</Text>
          <Text style={styles.rejectedText}>{rejectionReason}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Documents</Text>
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
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Vehicle</Text>
        <Pressable onPress={() => navigation.navigate(ROUTES.VEHICLE_DETAILS)} hitSlop={8}>
          <Text style={styles.retake}>Edit</Text>
        </Pressable>
      </View>
      <Card>
        <Detail label="Type" value={vehicle ? `${vehicle.label} · ${vehicle.localName}` : null} />
        <Detail label="Brand" value={details?.brand} />
        <Detail label="Model" value={details?.model} optional />
        <Detail label="Plate number" value={details?.plate} />
        <Detail label="Colour" value={details?.color} optional last />
      </Card>

      {touched && !ready ? (
        <Text style={styles.missing}>
          {missingDocs.length > 0
            ? `Add your ${missingDocs.map((t) => CAPTURE_CONFIG[t].shortLabel.toLowerCase()).join(', ')} before submitting.`
            : !vehicle
              ? 'Choose your vehicle type before submitting.'
              : 'Add your vehicle brand and plate number before submitting.'}
        </Text>
      ) : null}

      <Text style={styles.note}>
        An admin reviews your documents, usually within a day. You can book trips as a passenger
        while you wait.
      </Text>
    </Screen>
  );
}

function Detail({
  label,
  value,
  optional,
  last,
}: {
  label: string;
  value?: string | null;
  optional?: boolean;
  last?: boolean;
}) {
  const styles = useStyles();
  const empty = !value?.trim();

  return (
    <View style={[styles.detail, !last && styles.detailDivider]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, empty && !optional && styles.detailMissing]}>
        {empty ? (optional ? '—' : 'Missing') : value}
      </Text>
    </View>
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
  section: { ...type.heading, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  detailLabel: type.bodySmall,
  detailValue: { ...type.subheading, fontSize: 15, flexShrink: 1, textAlign: 'right' },
  detailMissing: { color: colors.danger },
  rejected: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.base,
    padding: spacing.md,
    marginBottom: spacing.base,
    gap: spacing.xs,
  },
  rejectedTitle: { ...type.subheading, fontSize: 15, color: colors.danger },
  rejectedText: { ...type.bodySmall, color: colors.text },
  missing: { ...type.bodySmall, color: colors.danger, marginTop: spacing.md },
  note: { ...type.caption, marginTop: spacing.base, lineHeight: 18 },
}));
