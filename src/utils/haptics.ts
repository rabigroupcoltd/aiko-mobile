import * as Haptics from 'expo-haptics';

/**
 * Named haptic moments, so every screen buzzes the same way for the same kind
 * of event. Failures are swallowed — haptics are a garnish, never a blocker.
 */
function safe(run: () => Promise<void>) {
  run().catch(() => undefined);
}

export const haptics = {
  /** Any ordinary button press. */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Choosing between options: vehicle, tab, star. */
  select: () => safe(() => Haptics.selectionAsync()),
  /** A firm commit: placing an order, a swipe crossing its threshold. */
  commit: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Something good happened: rider found, delivered, order won. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Needs attention: a new offer arrives, an assignment lands. */
  alert: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
