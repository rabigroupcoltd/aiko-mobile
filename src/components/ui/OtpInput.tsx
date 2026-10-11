import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { makeStyles, radius, spacing } from '@/theme';

interface OtpInputProps {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  autoFocus?: boolean;
  error?: boolean;
}

export interface OtpInputHandle {
  focus: () => void;
}

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { value, onChange, length = 4, autoFocus = true, error = false },
  ref
) {
  const styles = useStyles();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const focusInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    if (input.isFocused()) input.blur();
    input.focus();
  }, []);

  useImperativeHandle(ref, () => ({ focus: focusInput }), [focusInput]);

  const digits = value.padEnd(length).split('').slice(0, length);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable style={styles.row} onPress={focusInput}>
      {digits.map((digit, i) => {
        const isActive = focused && i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.box,
              isActive && styles.boxActive,
              error && styles.boxError,
            ]}>
            <Text style={styles.digit}>{digit.trim()}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        style={styles.hidden}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D+/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
      />
    </Pressable>
  );
});

const useStyles = makeStyles(({ colors, type }) => ({
  row: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  box: {
    width: 60,
    height: 68,
    borderRadius: radius.base,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
  boxError: { borderColor: colors.danger },
  digit: { ...type.title, fontSize: 28 },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
}));
