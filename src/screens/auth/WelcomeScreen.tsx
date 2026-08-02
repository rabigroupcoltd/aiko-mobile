import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, GoogleSignInButton } from '@/components/ui';
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
import { green, makeStyles, radius, screenGutter, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.WELCOME>;

const HIGHLIGHTS = [
  { icon: '🏍️', title: 'Bikes and Keke', body: 'Pick whichever suits your trip.' },
  { icon: '📍', title: 'Minna landmarks', body: 'Search by the places you already know.' },
  { icon: '🛡️', title: 'Verified riders', body: 'Every rider passes an identity check.' },
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

      // Stores the session, so every later request is authenticated. The
      // navigator picks the branch from state on the next render — the phone
      // step still runs, because Google gives no number and a dispatch app
      // needs a reachable one.
      await signInWithFirebase({ idToken: exchanged.idToken });
      navigation.navigate(ROUTES.PHONE_ENTRY);
    } catch {
      // useApiManager has already shown the reason.
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Image
          source={require('../../../assets/logo-aiko.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Dispatch & delivery across Minna</Text>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.title}>Move around Minna, easily</Text>
        <Text style={styles.subtitle}>
          Book a bike or keke in seconds, or sign up to ride and earn.
        </Text>

        <View style={styles.highlights}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.title} style={styles.highlight}>
              <View style={styles.highlightIcon}>
                <Text style={styles.highlightEmoji}>{h.icon}</Text>
              </View>
              <View style={styles.highlightText}>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                <Text style={styles.highlightBody}>{h.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button
          label="Continue with phone"
          onPress={() => navigation.navigate(ROUTES.PHONE_ENTRY)}
          testID="welcome-get-started"
        />

        {/* Hidden entirely when no OAuth client is configured — a button that
            can only ever fail is worse than no button. */}
        {isGoogleSignInConfigured ? (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <GoogleSignInButton onPress={handleGoogle} loading={googleLoading} />
          </>
        ) : null}

        <Text style={styles.legal}>
          By continuing you agree to Aiko&apos;s Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  // The hero stays brand green in both schemes; only the sheet below flips.
  container: { flex: 1, backgroundColor: green[500] },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  logo: { width: 220, height: 160, marginBottom: spacing.xs },
  tagline: { ...type.bodySmall, color: green[100] },

  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  title: type.title,
  subtitle: type.bodySmall,
  highlights: { gap: spacing.md, marginVertical: spacing.sm },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightEmoji: { fontSize: 18 },
  highlightText: { flex: 1, gap: 1 },
  highlightTitle: { ...type.subheading, fontSize: 15 },
  highlightBody: type.caption,
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: type.caption,
  legal: { ...type.caption, textAlign: 'center', marginTop: spacing.xxs },
}));
