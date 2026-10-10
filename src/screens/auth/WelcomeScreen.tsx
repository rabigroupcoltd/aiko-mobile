import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AikoLogo } from '@/components/brand/AikoLogo';
import { BRAND_LIME } from '@/components/brand/AikoMark';
import { BrandBackdrop } from '@/components/brand/BrandBackdrop';
import { GoogleSignInButton, Icon, type IconName } from '@/components/ui';
import { FirebaseSignInManager } from '@/modules/auth/authController';
import { ROUTES } from '@/navigation/routes';
import type { AuthStackParamList } from '@/navigation/types';
import { exchangeGoogleToken } from '@/services/firebaseAuth';
import {
  describeFailure,
  isGoogleSignInConfigured,
  signInWithGoogle,
} from '@/services/googleAuth';
import { useAppStore } from '@/store/appStore';
import { green, makeStyles, radius, screenGutter, shadows, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.WELCOME>;

const HIGHLIGHTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'bike', title: 'Bikes and Keke', body: 'Pick whichever suits your trip.' },
  { icon: 'map-pin', title: 'Minna landmarks', body: 'Search by the places you already know.' },
  { icon: 'shield-check', title: 'Verified riders', body: 'Every rider passes an identity check.' },
];

export function WelcomeScreen({ navigation }: Props) {
  const styles = useStyles();
  const setGoogleAccount = useAppStore((s) => s.setGoogleAccount);
  const { signInWithFirebase } = FirebaseSignInManager();
  const [googleLoading, setGoogleLoading] = useState(false);

  /**
   * Google → Firebase → our API, in that order.
   *
   * Three hops because each one only produces what the next needs: Google
   * proves who they are, Firebase turns that into a token our backend trusts,
   * and the backend turns that into a session plus the onboarding state.
   *
   * No navigation call on success: storing the session updates `authStore`,
   * and RootNavigator swaps this screen out for OnboardingStack — resuming at
   * PHONE, since Google gives no number and a dispatch app needs a reachable
   * one — on its next render.
   */
  const handleGoogle = async () => {
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();

      if (!result.ok) {
        // A cancellation is a deliberate user action, not an error worth a dialog.
        if (result.reason !== 'cancelled') {
          Alert.alert('Google sign-in', describeFailure(result.reason));
        }
        return;
      }

      // Kept for the profile form's pre-fill, whatever happens below.
      setGoogleAccount(result.account);

      if (!result.idToken) {
        // Means the web client ID is missing from the Google Sign-In config —
        // sign-in "succeeds" but yields nothing we can exchange.
        Alert.alert('Google sign-in', 'Sign-in did not return a token. Please try again.');
        return;
      }

      const exchanged = await exchangeGoogleToken(result.idToken);
      if (!exchanged.ok) {
        Alert.alert('Google sign-in', exchanged.message);
        return;
      }

      await signInWithFirebase({ idToken: exchanged.idToken });
    } catch {
      // useApiManager has already shown the reason.
    } finally {
      setGoogleLoading(false);
    }
  };

  const { height } = useWindowDimensions();
  const showTrip = height >= 720;

  return (
    <View style={styles.container}>
      <BrandBackdrop />

      <SafeAreaView style={styles.hero} edges={['top']}>
        <AikoLogo size={48} tone="onBrand" />

        <View style={styles.heroCopy}>
          <Text style={styles.headline}>
            Send anything.{'\n'}
            <Text style={styles.headlineAccent}>We deliver fast.</Text>
          </Text>
          <Text style={styles.tagline}>Bikes and keke across Minna, a tap away.</Text>
        </View>

        {/* Short phones keep the sign-in sheet in view instead of the illustration. */}
        {showTrip ? <TripPreview /> : null}
      </SafeAreaView>

      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <View style={styles.highlights}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.title} style={styles.highlight}>
              <View style={styles.highlightIcon}>
                <Icon name={h.icon} size={20} color={green[600]} />
              </View>
              <View style={styles.highlightText}>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                <Text style={styles.highlightBody}>{h.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/*
          Google is the only credential that gets a real backend session right
          now — a dispatch app needs a reachable phone number, but there is no
          SMS provider behind the OTP screen yet (see featureFlags.REQUIRE_OTP),
          so a phone-only sign-in has nothing to verify against. Hidden
          entirely when no OAuth client is configured either — a button that
          can only ever fail is worse than no button.
        */}
        {isGoogleSignInConfigured ? (
          <GoogleSignInButton onPress={handleGoogle} loading={googleLoading} />
        ) : (
          <Text style={styles.legal}>Sign-in is not configured for this build yet.</Text>
        )}

        <Text style={styles.legal}>
          By continuing you agree to Aiko&apos;s Terms of Service and Privacy Policy.
        </Text>
      </SafeAreaView>
    </View>
  );
}

/**
 * A little illustrated trip card — pickup, drop-off and a rider on the way —
 * so the first screen shows what the app does instead of only saying it.
 * Decorative: hidden from screen readers.
 */
function TripPreview() {
  const styles = useStyles();

  return (
    <View style={styles.trip} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.tripRoute}>
        <View style={styles.tripStops}>
          <View style={[styles.dot, styles.dotFrom]} />
          <View style={styles.tripLine} />
          <View style={[styles.dot, styles.dotTo]} />
        </View>
        <View style={styles.tripPlaces}>
          <View>
            <Text style={styles.tripLabel}>Pickup</Text>
            <Text style={styles.tripPlace}>Kpakungu Roundabout</Text>
          </View>
          <View>
            <Text style={styles.tripLabel}>Drop-off</Text>
            <Text style={styles.tripPlace}>Bosso Market</Text>
          </View>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.eta}>
          <Icon name="zap" size={14} color={green[900]} strokeWidth={2.4} />
          <Text style={styles.etaText}>Rider 3 min away</Text>
        </View>
        <Text style={styles.fare}>₦1,200</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  // The hero stays brand green in both schemes; only the sheet below flips.
  container: { flex: 1, backgroundColor: green[500] },

  hero: {
    flex: 1,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  heroCopy: { gap: spacing.sm },
  headline: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  headlineAccent: { color: BRAND_LIME },
  tagline: { ...type.body, color: green[50], opacity: 0.9 },

  trip: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    ...shadows.lg,
  },
  tripRoute: { flexDirection: 'row', gap: spacing.md },
  tripStops: { alignItems: 'center', paddingVertical: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3 },
  dotFrom: { borderColor: green[500], backgroundColor: '#FFFFFF' },
  dotTo: { borderColor: green[900], backgroundColor: green[900] },
  tripLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    borderLeftWidth: 2,
    borderColor: green[200],
    borderStyle: 'dashed',
  },
  tripPlaces: { flex: 1, gap: spacing.md },
  tripLabel: { fontSize: 11, lineHeight: 14, color: '#6E7B77', letterSpacing: 0.3 },
  tripPlace: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: '#111917' },
  tripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EFF2F1',
    paddingTop: spacing.md,
  },
  eta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND_LIME,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  etaText: { fontSize: 13, fontWeight: '700', color: green[900] },
  fare: { fontSize: 17, fontWeight: '800', color: '#111917' },

  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
    gap: spacing.md,
  },
  highlights: { gap: spacing.md, marginBottom: spacing.sm },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  highlightIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.base,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: { flex: 1, gap: 1 },
  highlightTitle: { ...type.subheading, fontSize: 15 },
  highlightBody: type.caption,
  legal: { ...type.caption, textAlign: 'center', marginTop: spacing.xxs },
}));
