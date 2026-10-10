import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppHeader, Button, LoadingOverlay, OtpInput, Screen } from '@/components/ui';
import type { OtpInputHandle } from '@/components/ui';
import { OTP_COPY } from '@/data/copy';
import { useCountdown } from '@/hooks/useCountdown';
import { UpdateOnboardingManager } from '@/modules/onboarding/onboardingController';
import { ROUTES, onboardingStepRoute } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { makeStyles, radius, spacing } from '@/theme';
import { formatE164ForDisplay } from '@/utils/phone';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.OTP>;

const CODE_LENGTH = 4;

export function OtpScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { phone } = route.params;
  const { updateOnboarding } = UpdateOnboardingManager();

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { remaining, restart, isDone } = useCountdown(30);
  const otpRef = useRef<OtpInputHandle>(null);

  // The input's own `autoFocus` fires while this screen is still animating in,
  // and Android quietly ignores a keyboard request made mid-transition — you
  // land on the screen with the field focused but no keypad. Ask again once the
  // push animation has actually finished; native-stack tells us exactly when.
  useEffect(
    () => navigation.addListener('transitionEnd', () => otpRef.current?.focus()),
    [navigation]
  );

  const verify = async () => {
    setVerifying(true);
    try {
      // TODO: verify the code with the SMS provider. Nothing checks it today —
      // any four digits pass — which is why REQUIRE_OTP is off and this screen
      // is unreachable. Do not turn that flag on until this calls something.
      const state = await updateOnboarding({ phone });
      const next = onboardingStepRoute(state.resumeStep);
      if (next) navigation.navigate(next);
    } catch {
      // useApiManager has already shown the reason.
    } finally {
      setVerifying(false);
    }
  };

  // Auto-submit once the code is complete, which is what users expect.
  useEffect(() => {
    if (code.length === CODE_LENGTH && !verifying) void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <Screen
      keyboardAvoiding
      footer={
        <Button
          label="Verify"
          onPress={verify}
          disabled={code.length !== CODE_LENGTH}
          loading={verifying}
        />
      }>
      <AppHeader onBack={() => navigation.goBack()} title={OTP_COPY.title} />

      <Text style={styles.subtitle}>
        {OTP_COPY.subtitle} <Text style={styles.phone}>{formatE164ForDisplay(phone)}</Text>
      </Text>

      <View style={styles.inputWrap}>
        <OtpInput ref={otpRef} value={code} onChange={setCode} length={CODE_LENGTH} />
      </View>

      <View style={styles.resendRow}>
        {isDone ? (
          <Pressable
            onPress={() => {
              setCode('');
              restart();
            }}
            hitSlop={8}>
            <Text style={styles.resendActive}>{OTP_COPY.resend}</Text>
          </Pressable>
        ) : (
          <Text style={styles.resendWaiting}>
            {OTP_COPY.resend} in {remaining}s
          </Text>
        )}
      </View>

      <LoadingOverlay visible={verifying} message="Verifying your code…" />
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  subtitle: { ...type.bodySmall, marginBottom: spacing.xl },
  phone: { ...type.subheading, fontSize: 14, color: colors.text },
  inputWrap: { marginBottom: spacing.lg },
  resendRow: { alignItems: 'center' },
  resendActive: { ...type.subheading, fontSize: 14, color: colors.primary },
  resendWaiting: type.bodySmall,
}));
