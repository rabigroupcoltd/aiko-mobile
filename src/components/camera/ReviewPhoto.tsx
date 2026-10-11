import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, screenGutter, spacing, typography } from '@/theme';

interface ReviewPhotoProps {
  uri: string;
  title: string;
  confirmLabel: string;
  busy?: boolean;
  onRetake: () => void;
  onConfirm: () => void;
}

export function ReviewPhoto({
  uri,
  title,
  confirmLabel,
  busy = false,
  onRetake,
  onConfirm,
}: ReviewPhotoProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>Check it&apos;s clear and readable before continuing.</Text>

      <View style={styles.preview}>
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.actions}>
        <Button label="Retake" variant="secondary" onPress={onRetake} disabled={busy} />
        <Button label={confirmLabel} onPress={onConfirm} loading={busy} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
    paddingHorizontal: screenGutter,
    paddingTop: spacing.lg,
  },
  title: { ...typography.heading, color: colors.onPrimary, textAlign: 'center' },
  hint: {
    ...typography.caption,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  preview: {
    flex: 1,
    marginVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  actions: { gap: spacing.sm, paddingBottom: spacing.base },
});
