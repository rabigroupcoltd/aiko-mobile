import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { makeStyles, screenGutter, spacing, useTheme } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. Off for full-bleed screens like the camera. */
  scroll?: boolean;
  /** Apply the standard horizontal gutter. Off for edge-to-edge content. */
  padded?: boolean;
  /** Lift content above the keyboard — on for any screen with a text input. */
  keyboardAvoiding?: boolean;
  edges?: Edge[];
  background?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Pinned to the bottom, outside the scroll area — for primary CTAs. */
  footer?: ReactNode;
}

/**
 * Standard screen shell: safe area, background, optional scrolling and keyboard
 * avoidance. Using this everywhere is what keeps ~30 screens visually aligned.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  keyboardAvoiding = false,
  edges = ['top', 'bottom'],
  background,
  style,
  contentStyle,
  footer,
}: ScreenProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        padded && styles.padded,
        styles.scrollContent,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, contentStyle]}>{children}</View>
  );

  const body = (
    <>
      {inner}
      {footer ? (
        <View style={[styles.footer, padded && styles.footerPadded]}>{footer}</View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: background ?? colors.background }, style]}
      edges={edges}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(() => ({
  flex: { flex: 1 },
  padded: { paddingHorizontal: screenGutter },
  scrollContent: { paddingBottom: spacing.xxl, flexGrow: 1 },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  footerPadded: { paddingHorizontal: screenGutter },
}));
