import { Text, View } from 'react-native';

import { AppHeader, Avatar, Button, Card, Chip, Screen } from '@/components/ui';
import { useOnboardingState } from '@/modules/onboarding/onboardingController';
import { useOpenCamera, useOpenDrawer } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { makeStyles, spacing } from '@/theme';
import { formatE164ForDisplay } from '@/utils/phone';

export function ProfileScreen() {
  const styles = useStyles();
  const openDrawer = useOpenDrawer();
  const openCamera = useOpenCamera();

  const user = useAuthStore((s) => s.user);
  const onboarding = useOnboardingState();
  // The just-captured photo, if the user retook it this session; the
  // persisted one otherwise.
  const localPhoto = useAppStore((s) => s.photos.profile);

  const isRider = onboarding?.accountType === 'RIDER';
  const approved = onboarding?.driver.status === 'APPROVED';
  const livenessPassed = onboarding?.requirements.liveness ?? false;
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '—';

  return (
    <Screen scroll>
      <AppHeader onMenu={openDrawer} title="Profile" />

      <View style={styles.hero}>
        <Avatar
          uri={localPhoto?.uri ?? user?.profilePhotoUrl ?? undefined}
          name={fullName}
          size={96}
        />
        <Text style={styles.name}>{fullName}</Text>
        <View style={styles.chips}>
          <Chip label={isRider ? 'Rider' : 'Passenger'} tone="brand" />
          {livenessPassed ? <Chip label="✓ Identity verified" tone="success" /> : null}
          {isRider ? (
            <Chip
              label={approved ? 'Approved' : 'Pending review'}
              tone={approved ? 'success' : 'pending'}
              dot
            />
          ) : null}
        </View>

        <Button
          label="Change photo"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={() => openCamera('profile')}
          leading={<Text>📷</Text>}
        />
      </View>

      <Card style={styles.details}>
        <Text style={styles.sectionTitle}>Account details</Text>
        <Row label="Phone number" value={user?.phone ? formatE164ForDisplay(user.phone) : '—'} />
        <Row label="Email address" value={user?.email ?? '—'} />
        <Row label="Date of birth" value={user?.dob ?? '—'} />
        <Row
          label="Member since"
          value={
            user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'
          }
        />
      </Card>

      <Card style={styles.details}>
        <Text style={styles.sectionTitle}>Verification</Text>
        <Row
          label="Liveness check"
          value={livenessPassed ? 'Passed' : 'Not completed'}
          valueTone={livenessPassed ? 'success' : 'muted'}
        />
        {user?.livenessPassedAt ? (
          <Row
            label="Verified on"
            value={new Date(user.livenessPassedAt).toLocaleString('en-NG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        ) : null}
      </Card>
    </Screen>
  );
}

function Row({
  label,
  value,
  valueTone,
}: {
  label: string;
  value: string;
  valueTone?: 'success' | 'muted';
}) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          valueTone === 'success' && styles.rowValueSuccess,
          valueTone === 'muted' && styles.rowValueMuted,
        ]}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  name: { ...type.title },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  details: { marginTop: spacing.base, gap: spacing.md },
  sectionTitle: { ...type.label },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.base },
  rowLabel: { ...type.bodySmall },
  rowValue: { ...type.body, fontSize: 15, flexShrink: 1, textAlign: 'right' },
  rowValueSuccess: { color: colors.success, fontWeight: '600' },
  rowValueMuted: { color: colors.textMuted },
}));
