import { Text, View } from 'react-native';

import { AppHeader, Button, Card, Chip, Screen } from '@/components/ui';
import { useOpenDrawer } from '@/navigation/useAppNavigation';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing } from '@/theme';

const TIMELINE = [
  { label: 'Documents submitted', state: 'done' as const },
  { label: 'Admin review', state: 'active' as const },
  { label: 'Start accepting trips', state: 'todo' as const },
];

export function PendingApprovalScreen() {
  const styles = useStyles();
  const openDrawer = useOpenDrawer();
  const documents = useAppStore((s) => s.documents);

  return (
    <Screen scroll>
      <AppHeader onMenu={openDrawer} />

      <View style={styles.hero}>
        <View style={styles.clock}>
          <Text style={styles.clockIcon}>⏳</Text>
        </View>
        <Text style={styles.title}>Your application is under review</Text>
        <Text style={styles.subtitle}>
          We&apos;re checking your documents. You&apos;ll get a notification as soon as
          you&apos;re approved.
        </Text>
        <Chip label="Pending approval" tone="pending" dot />
      </View>

      <Card style={styles.timeline}>
        {TIMELINE.map((item, i) => (
          <View key={item.label} style={styles.timelineRow}>
            <View style={styles.timelineMarker}>
              <View
                style={[
                  styles.dot,
                  item.state === 'done' && styles.dotDone,
                  item.state === 'active' && styles.dotActive,
                ]}>
                {item.state === 'done' ? <Text style={styles.tick}>✓</Text> : null}
              </View>
              {i < TIMELINE.length - 1 ? <View style={styles.connector} /> : null}
            </View>

            <View style={styles.timelineBody}>
              <Text
                style={[
                  styles.timelineLabel,
                  item.state === 'todo' && styles.timelineLabelMuted,
                ]}>
                {item.label}
              </Text>
              {item.state === 'active' ? (
                <Text style={styles.timelineHint}>Usually within 24 hours</Text>
              ) : null}
            </View>
          </View>
        ))}
      </Card>

      <Card style={styles.summary}>
        <Text style={styles.summaryTitle}>What we received</Text>
        <Text style={styles.summaryItem}>
          {documents.license ? '✓' : '—'} Driver&apos;s licence
        </Text>
        <Text style={styles.summaryItem}>
          {documents.nationalId ? '✓' : '—'} National ID
        </Text>
        <Text style={styles.summaryItem}>{documents.plate ? '✓' : '—'} Vehicle plate</Text>
        <Text style={styles.summaryItem}>
          {documents.vehicleType ? '✓' : '—'} Vehicle type
          {documents.vehicleType ? ` (${documents.vehicleType})` : ''}
        </Text>
      </Card>

      <Text style={styles.support}>
        Something wrong? Contact support on 0800 000 0000.
      </Text>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  clock: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  clockIcon: { fontSize: 40 },
  title: { ...type.title, textAlign: 'center' },
  subtitle: {
    ...type.bodySmall,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: spacing.sm,
  },

  timeline: { marginTop: spacing.base, gap: 0 },
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  timelineMarker: { alignItems: 'center', width: 24 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotActive: { borderColor: colors.warning, backgroundColor: colors.warningBg },
  tick: { color: colors.onPrimary, fontSize: 11, fontWeight: '700', lineHeight: 13 },
  connector: { flex: 1, width: 2, backgroundColor: colors.border, minHeight: 28 },
  timelineBody: { flex: 1, paddingBottom: spacing.base, gap: 2 },
  timelineLabel: { ...type.subheading, fontSize: 15 },
  timelineLabelMuted: { color: colors.textMuted, fontWeight: '400' },
  timelineHint: type.caption,

  summary: { marginTop: spacing.base, gap: spacing.xs },
  summaryTitle: { ...type.label, marginBottom: spacing.xxs },
  summaryItem: type.bodySmall,

  support: {
    ...type.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

}));
