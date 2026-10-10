import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppHeader, Button, LoadingOverlay, PhoneInput, Screen } from '@/components/ui';
import { featureFlags } from '@/config/featureFlags';
import { UpdateOnboardingManager } from '@/modules/onboarding/onboardingController';
import { ROUTES, onboardingStepRoute } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { makeStyles, radius, spacing } from '@/theme';
import { isValidNigerianPhone, toE164 } from '@/utils/phone';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.PHONE_ENTRY>;

export function PhoneEntryScreen({ navigation }: Props) {
  const styles = useStyles();
  const { updateOnboarding } = UpdateOnboardingManager();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  // The flag lives here rather than server-side: "do we verify numbers this
  // release" is a product decision about this screen, and the account is
  // created either way — REQUIRE_OTP only decides whether OTP runs first.
  const requireOtp = featureFlags.REQUIRE_OTP;

  const handleContinue = async () => {
    if (!isValidNigerianPhone(phone)) {
      setError('Enter a valid Nigerian mobile number.');
      return;
    }
    setError(undefined);

    if (requireOtp) {
      // TODO: request the SMS code from the provider before navigating.
      // Nothing is sent today, which is why REQUIRE_OTP is off.
      navigation.navigate(ROUTES.OTP, { phone: toE164(phone) });
      return;
    }

    setSending(true);
    try {
      const state = await updateOnboarding({ phone: toE164(phone) });
      const next = onboardingStepRoute(state.resumeStep);
      if (next) navigation.navigate(next);
      // No route for the resolved step (RIDER_DOCS/AWAITING_APPROVAL/DONE)
      // means onboarding just finished — RootNavigator swaps the stack itself.
    } catch {
      // useApiManager has already shown the reason.
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      keyboardAvoiding
      footer={
        <Button
          label={requireOtp ? 'Send code' : 'Continue'}
          onPress={handleContinue}
          disabled={!isValidNigerianPhone(phone)}
          loading={sending}
          testID="phone-continue"
        />
      }>
      <AppHeader
        title="What's your number?"
        subtitle={
          requireOtp
            ? "We'll send you a code to confirm it's really you."
            : "Your rider will use this to reach you about your trip."
        }
      />

      <View style={styles.form}>
        <PhoneInput
          value={phone}
          onChange={(v) => {
            setPhone(v);
            if (error) setError(undefined);
          }}
          error={error}
          autoFocus
        />

        <View style={styles.note}>
          <Text style={styles.noteIcon}>💬</Text>
          <Text style={styles.noteText}>
            {requireOtp
              ? 'Standard SMS rates may apply. We never share your number with other users.'
              : 'We only share your number with the rider handling your trip.'}
          </Text>
        </View>
      </View>

      <LoadingOverlay visible={sending} message="Saving your number…" />
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  form: { marginTop: spacing.base },
  note: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.base,
  },
  noteIcon: { fontSize: 16 },
  noteText: { ...type.caption, flex: 1, lineHeight: 18 },
}));
