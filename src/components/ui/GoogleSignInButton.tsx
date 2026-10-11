import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native';

import { makeStyles, radius, spacing, useTheme } from '@/theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  style?: ViewStyle;
}

export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
  label = 'Continue with Google',
  style,
}: GoogleSignInButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inert = loading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        pressed && !inert && styles.pressed,
        inert && styles.inert,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <>
          <View style={styles.mark}>
            <Text style={styles.markText}>G</Text>
          </View>
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.base,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignSelf: 'stretch',
  },
  pressed: { opacity: 0.85 },
  inert: { opacity: 0.45 },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
  },
  markText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 17,
  },
  label: { ...type.button, color: colors.text },
}));
