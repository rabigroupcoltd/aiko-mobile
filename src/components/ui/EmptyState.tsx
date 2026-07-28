import { Text, View, type ViewStyle } from 'react-native';

import { makeStyles, radius, spacing } from '@/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, body, action, style }: EmptyStateProps) {
  const styles = useStyles();

  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View style={styles.iconBadge}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  icon: { fontSize: 28 },
  title: { ...type.subheading, textAlign: 'center' },
  body: { ...type.bodySmall, textAlign: 'center', maxWidth: 300 },
  action: { marginTop: spacing.base, alignSelf: 'stretch' },
}));
