import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Button } from '../components/Button';

export const OTPScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<any>([]);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
    setResent(true);
    setResendCooldown(30);
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const isComplete = otp.every(digit => digit !== '');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={COLORS.black} size={28} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to <Text style={styles.phoneText}>{route.params?.phone || '+234 800 000 0000'}</Text>
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                style={[styles.otpInput, digit !== '' && styles.otpInputActive]}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resendCooldown > 0}>
            <Text style={styles.resendText}>
              {resent && resendCooldown > 0
                ? `Code resent. Try again in ${resendCooldown}s`
                : resendCooldown > 0
                  ? `Didn't receive code? Resend in ${resendCooldown}s`
                  : "Didn't receive code? "}
              {resendCooldown === 0 && <Text style={styles.resendLink}>Resend</Text>}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Verify Code" 
            onPress={() => navigation.navigate('Welcome')} 
            disabled={!isComplete}
          />


        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  titleSection: {
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
    lineHeight: 24,
  },
  phoneText: {
    color: COLORS.black,
    fontWeight: '700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.black,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  otpInputActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },

  resendButton: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  footer: {
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
});
