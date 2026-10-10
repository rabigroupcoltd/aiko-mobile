import { Image, Pressable, Text, View } from 'react-native';

import { AppHeader, Card, Chip, EmptyState, Screen } from '@/components/ui';
import { CAPTURE_CONFIG } from '@/data/copy';
import { getVehicle } from '@/data/vehicleTypes';
import { useOnboardingState } from '@/modules/onboarding/onboardingController';
import { useOpenCamera, useOpenDrawer } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing } from '@/theme';
import type { RiderDocumentTarget } from '@/types/models';

const DOCS: RiderDocumentTarget[] = ['license', 'nationalId', 'plate'];

export function MyDocumentsScreen() {
  const styles = useStyles();
  const openDrawer = useOpenDrawer();
  const openCamera = useOpenCamera();

  const documents = useAppStore((s) => s.documents);
  const driverStatus = useOnboardingState()?.driver.status ?? 'NOT_SUBMITTED';

  const vehicle = documents.vehicleType ? getVehicle(documents.vehicleType) : null;
  const hasAny = DOCS.some((d) => documents[d]);

  const statusTone =
    driverStatus === 'APPROVED'
      ? ('success' as const)
      : driverStatus === 'PENDING'
        ? ('pending' as const)
        : driverStatus === 'REJECTED'
          ? ('danger' as const)
          : ('neutral' as const);

  const statusLabel =
    driverStatus === 'APPROVED'
      ? 'Approved'
      : driverStatus === 'PENDING'
        ? 'Under review'
        : driverStatus === 'REJECTED'
          ? 'Rejected'
          : 'Not submitted';

  return (
    <Screen scroll>
      <AppHeader
        onMenu={openDrawer}
        title="My documents"
        subtitle="Tap any document to retake it."
        trailing={<Chip label={statusLabel} tone={statusTone} dot />}
      />

      {!hasAny ? (
        <EmptyState
          icon="📄"
          title="No documents yet"
          body="Rider documents you capture will appear here."
        />
      ) : (
        <View style={styles.list}>
          {DOCS.map((target) => {
            const asset = documents[target];
            const config = CAPTURE_CONFIG[target];

            return (
              <Pressable
                key={target}
                onPress={() => openCamera(target)}
                accessibilityRole="button"
                accessibilityLabel={`Retake ${config.shortLabel}`}>
                <Card style={styles.card}>
                  {asset ? (
                    <Image source={{ uri: asset.uri }} style={styles.thumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}>
                      <Text style={styles.thumbIcon}>📄</Text>
                    </View>
                  )}

                  <View style={styles.body}>
                    <Text style={styles.title}>{config.shortLabel}</Text>
                    {asset ? (
                      <Text style={styles.meta}>
                        Captured{' '}
                        {new Date(asset.capturedAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    ) : (
                      <Text style={styles.meta}>Not captured yet</Text>
                    )}
                    <Chip
                      label={asset ? 'On file' : 'Missing'}
                      tone={asset ? 'success' : 'danger'}
                    />
                  </View>

                  <Text style={styles.action}>{asset ? 'Retake' : 'Add'}</Text>
                </Card>
              </Pressable>
            );
          })}

          {vehicle ? (
            <Card style={styles.card}>
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Text style={styles.thumbIcon}>{vehicle.emoji}</Text>
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>Vehicle type</Text>
                <Text style={styles.meta}>
                  {vehicle.label} · {vehicle.localName}
                </Text>
                <Chip label={vehicle.capacity} tone="brand" />
              </View>
            </Card>
          ) : null}
        </View>
      )}

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Documents are stored only on this device in the demo — nothing is uploaded.
        </Text>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  list: { gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbIcon: { fontSize: 26 },
  body: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  title: { ...type.subheading, fontSize: 15 },
  meta: { ...type.caption },
  action: { ...type.subheading, fontSize: 14, color: colors.primary },
  notice: { marginTop: spacing.xl },
  noticeText: { ...type.caption, textAlign: 'center' },
}));
