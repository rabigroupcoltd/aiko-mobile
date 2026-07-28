import { Image, Pressable, Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { CAPTURE_CONFIG } from '@/data/copy';
import { useOpenCamera } from '@/navigation/useAppNavigation';
import { makeStyles, radius, spacing } from '@/theme';
import type { CaptureTarget, DocumentAsset } from '@/types/models';

interface CapturePromptProps {
  target: CaptureTarget;
  asset?: DocumentAsset;
  /** Bullet points explaining what makes a good photo. */
  tips?: string[];
}

/**
 * The "take / retake this photo" panel.
 *
 * Shared by the profile photo screen and all three rider document screens —
 * they differ only in target and tips, so they get one component rather than
 * four near-identical layouts.
 */
export function CapturePrompt({ target, asset, tips }: CapturePromptProps) {
  const styles = useStyles();
  const config = CAPTURE_CONFIG[target];
  const isProfile = target === 'profile';

  const open = useOpenCamera();
  const openCamera = () => open(target);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={openCamera}
        accessibilityRole="button"
        accessibilityLabel={
          asset ? `Retake ${config.shortLabel}` : `Take ${config.shortLabel}`
        }
        style={({ pressed }) => [pressed && styles.pressed]}>
        {asset ? (
          <View style={[styles.frame, isProfile && styles.frameRound]}>
            <Image
              source={{ uri: asset.uri }}
              style={[styles.image, isProfile && styles.imageRound]}
              resizeMode="cover"
            />
            <View style={styles.retakeBadge}>
              <Text style={styles.retakeText}>Tap to retake</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.placeholder, isProfile && styles.frameRound]}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Tap to open the camera</Text>
          </View>
        )}
      </Pressable>

      {tips && tips.length > 0 ? (
        <Card style={styles.tips} elevation="none">
          {tips.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {!asset ? (
        <Button
          label={`Take ${config.shortLabel.toLowerCase()}`}
          variant="secondary"
          onPress={openCamera}
          leading={<Text>📷</Text>}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  container: { gap: spacing.base, alignItems: 'stretch' },
  pressed: { opacity: 0.9 },
  frame: {
    alignSelf: 'center',
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  frameRound: { width: 200, aspectRatio: 1, borderRadius: 100 },
  image: { width: '100%', height: '100%' },
  imageRound: { borderRadius: 100 },
  retakeBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(17, 25, 23, 0.6)',
  },
  retakeText: {
    ...type.caption,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholder: {
    alignSelf: 'center',
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderIcon: { fontSize: 32 },
  placeholderText: type.bodySmall,
  tips: { backgroundColor: colors.primarySubtle, gap: spacing.xs },
  tipRow: { flexDirection: 'row', gap: spacing.sm },
  tipBullet: { ...type.bodySmall, color: colors.primary },
  tipText: { ...type.bodySmall, flex: 1 },
}));
