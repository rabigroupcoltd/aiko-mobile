import { Pressable, Text, View } from 'react-native';

import { makeStyles, radius, spacing, useTheme, type ThemePreference } from '@/theme';

interface Option {
  value: ThemePreference;
  label: string;
  icon: string;
}

const OPTIONS: Option[] = [
  { value: 'system', label: 'System', icon: '⚙️' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
];

/**
 * Appearance selector.
 *
 * Three explicit choices rather than a binary switch: with a plain on/off
 * toggle there is no way back to "follow my phone" once you've touched it, and
 * following the system is the default.
 */
export function ThemeToggle() {
  const styles = useStyles();
  const { preference, setPreference, scheme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Appearance</Text>
        {preference === 'system' ? (
          <Text style={styles.hint}>Following your device ({scheme})</Text>
        ) : null}
      </View>

      <View style={styles.group} accessibilityRole="radiogroup">
        {OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setPreference(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label} appearance`}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.icon}>{option.icon}</Text>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: { paddingHorizontal: spacing.base, paddingBottom: spacing.base, gap: spacing.sm },
  header: { gap: 2 },
  label: type.label,
  hint: type.caption,
  group: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.base,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  pressed: { opacity: 0.85 },
  icon: { fontSize: 20 },
  optionLabel: { ...type.caption, fontWeight: '600' },
  optionLabelSelected: { color: colors.primaryDarker },
}));
