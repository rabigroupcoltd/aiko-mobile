import { Text, View } from 'react-native';

import { AppHeader, Avatar, Button, Card, Chip, Screen } from '@/components/ui';
import { useOpenCamera, useOpenDrawer } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { makeStyles, spacing } from '@/theme';
import { formatE164ForDisplay } from '@/utils/phone';

export function ProfileScreen() {
  const styles = useStyles();
  const openDrawer = useOpenDrawer();
  const openCamera = useOpenCamera();

  const user = useAppStore((s) => s.user);
  const role = useAppStore((s) => s.role);
  const verificationStatus = useAppStore((s) => s.verificationStatus);
  const livenessPassed = useAppStore((s) => s.livenessPassed);
  const livenessAt = useAppStore((s) => s.livenessAt);
  const photo = useAppStore((s) => s.photos.profile);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '—';

  return (
    <Screen scroll>
      <AppHeader onMenu={openDrawer} title="Profile" />

      <View style={styles.hero}>
        <Avatar uri={photo?.uri} name={fullName} size={96} />
        <Text style={styles.name}>{fullName}</Text>
        <View style={styles.chips}>
          <Chip
            label={role === 'rider' ? 'Rider' : 'Passenger'}
            tone="brand"
          />
          {livenessPassed ? <Chip label="✓ Identity verified" tone="success" /> : null}
          {role === 'rider' ? (
            <Chip
              label={verificationStatus === 'approved' ? 'Approved' : 'Pending review'}
              tone={verificationStatus === 'approved' ? 'success' : 'pending'}
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
        <Row label="Phone number" value={user ? formatE164ForDisplay(user.phone) : '—'} />
        <Row label="Email address" value={user?.email ?? '—'} />
        <Row label="Age" value={user ? String(user.age) : '—'} />
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
        {livenessAt ? (
          <Row
            label="Verified on"
            value={new Date(livenessAt).toLocaleString('en-NG', {
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
