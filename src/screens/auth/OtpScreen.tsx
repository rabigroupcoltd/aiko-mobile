import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppHeader, Button, LoadingOverlay, OtpInput, Screen } from '@/components/ui';
import { OTP_COPY } from '@/data/copy';
import { featureFlags } from '@/config/featureFlags';
import { useCountdown } from '@/hooks/useCountdown';
import { ROUTES } from '@/navigation/routes';
import type { AuthStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { makeStyles, radius, spacing } from '@/theme';
import { jitteredSleep } from '@/utils/delay';
import { formatE164ForDisplay } from '@/utils/phone';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.OTP>;

const CODE_LENGTH = 4;

export function OtpScreen({ navigation }: Props) {
  const styles = useStyles();
  const pendingPhone = useAppStore((s) => s.pendingPhone);
  const confirmOtp = useAppStore((s) => s.confirmOtp);

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { remaining, restart, isDone } = useCountdown(30);

  const verify = async () => {
    setVerifying(true);
    await jitteredSleep(featureFlags.FAKE_DELAY_MS);
    // Demo: any 4-digit code is accepted. There is no real verification here.
    confirmOtp();
    setVerifying(false);
    // No navigation call — confirming flips `phoneVerified`, and the root
    // switch swaps the auth stack for onboarding on the next render.
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
        {OTP_COPY.subtitle}{' '}
        <Text style={styles.phone}>
          {pendingPhone ? formatE164ForDisplay(pendingPhone) : 'your number'}
        </Text>
      </Text>

      <View style={styles.inputWrap}>
        <OtpInput value={code} onChange={setCode} length={CODE_LENGTH} />
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

      <View style={styles.demoHint}>
        <Text style={styles.demoIcon}>🧪</Text>
        <Text style={styles.demoText}>{OTP_COPY.demoHint}</Text>
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
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    padding: spacing.md,
    backgroundColor: colors.warningBg,
    borderRadius: radius.base,
  },
  demoIcon: { fontSize: 14 },
  demoText: { ...type.caption, color: colors.warning, flex: 1 },
}));
