import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

interface ShutterButtonProps {
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}

export function ShutterButton({ onPress, busy = false, disabled = false }: ShutterButtonProps) {
  const inert = busy || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel="Take photo"
      accessibilityState={{ disabled: inert, busy }}
      style={({ pressed }) => [
        styles.ring,
        pressed && !inert && styles.pressed,
        inert && styles.inert,
      ]}>
      <View style={styles.inner}>
        {busy ? <ActivityIndicator color={colors.primary} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.94 }] },
  inert: { opacity: 0.5 },
});
