import { Text, View } from 'react-native';

import { makeStyles, radius, spacing } from '@/theme';
import { spellCode } from '@/utils/orderCode';

/**
 * The customer's pickup code, big enough to read out to the rider. Before the
 * pickup it carries the instruction; afterwards it shrinks to a reference.
 */
export function OrderCodeCard({
  code,
  riderName,
  collected,
  isPackage,
}: {
  code: string;
  riderName: string;
  collected: boolean;
  isPackage?: boolean;
}) {
  const styles = useStyles();

  if (collected) {
    return (
      <View style={styles.compact} accessible accessibilityLabel={`Order code ${spellCode(code)}`}>
        <Text style={styles.compactLabel}>Order code</Text>
        <Text style={styles.compactCode}>{code}</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`Your order code is ${spellCode(code)}. Tell it to ${riderName} before you hand over or get on.`}>
      <Text style={styles.label}>YOUR ORDER CODE</Text>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.hint}>
        {isPackage
          ? `Tell ${riderName} this code before you hand over the package. If someone else is handing it over, send them the code.`
          : `Tell ${riderName} this code before you get on. They'll check it matches their screen.`}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  card: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  label: { ...type.caption, fontWeight: '700', letterSpacing: 1.2, color: colors.primaryDarker },
  code: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  hint: { ...type.bodySmall, textAlign: 'center' },

  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.base,
    backgroundColor: colors.surfaceAlt,
  },
  compactLabel: type.caption,
  compactCode: { ...type.subheading, fontSize: 16, letterSpacing: 2 },
}));
