import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppHeader, Button, LoadingOverlay, PhoneInput, Screen } from '@/components/ui';
import { featureFlags } from '@/config/featureFlags';
import { ROUTES } from '@/navigation/routes';
import type { AuthStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing } from '@/theme';
import { jitteredSleep } from '@/utils/delay';
import { isValidNigerianPhone } from '@/utils/phone';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.PHONE_ENTRY>;

export function PhoneEntryScreen({ navigation }: Props) {
  const styles = useStyles();
  const setPendingPhone = useAppStore((s) => s.setPendingPhone);
  const acceptPhoneUnverified = useAppStore((s) => s.acceptPhoneUnverified);

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  // The flag lives here rather than in the store: the store records facts, and
  // "do we verify numbers this release" is a product decision about this screen.
  const requireOtp = featureFlags.REQUIRE_OTP;

  const handleContinue = async () => {
    if (!isValidNigerianPhone(phone)) {
      setError('Enter a valid Nigerian mobile number.');
      return;
    }
    setError(undefined);

    if (!requireOtp) {
      // No SMS to wait for, so no fake latency either — pretending to send a
      // code we never send is the kind of thing that outlives the demo.
      acceptPhoneUnverified(phone);
      // No navigation call: this flips `phoneProvided`, and the root switch
      // swaps the auth stack for onboarding on the next render.
      return;
    }

    setSending(true);
    // Stands in for requesting an SMS code.
    await jitteredSleep(featureFlags.FAKE_DELAY_MS);

    setPendingPhone(phone);
    setSending(false);
    navigation.navigate(ROUTES.OTP);
  };

  return (
    <Screen
      keyboardAvoiding
      footer={
        <Button
          label={requireOtp ? 'Send code' : 'Continue'}
          onPress={handleContinue}
          disabled={!isValidNigerianPhone(phone)}
          testID="phone-continue"
        />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
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

      <LoadingOverlay visible={sending} message="Sending your code…" />
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
