import { Text, TextInput, View } from 'react-native';

import { makeStyles, radius, spacing, useTheme } from '@/theme';
import {
  PHONE_COUNTRY_CODE,
  PHONE_NSN_LENGTH,
  formatNationalNumber,
  toNationalNumber,
} from '@/utils/phone';

interface PhoneInputProps {
  /** The raw national significant number, e.g. "8031234567". */
  value: string;
  onChange: (nationalNumber: string) => void;
  error?: string;
  autoFocus?: boolean;
}

/**
 * Phone entry with a fixed +234 chip. The country code is not editable — this
 * demo is Minna-only, and a free-text country field is a needless way for a
 * stakeholder to end up with an unparseable number on stage.
 */
export function PhoneInput({ value, onChange, error, autoFocus }: PhoneInputProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View>
      <Text style={styles.label}>Phone number</Text>

      <View style={[styles.field, !!error && styles.fieldError]}>
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>{PHONE_COUNTRY_CODE}</Text>
        </View>

        <TextInput
          style={styles.input}
          value={formatNationalNumber(value)}
          onChangeText={(text) => onChange(toNationalNumber(text))}
          placeholder="803 123 4567"
          placeholderTextColor={colors.textDisabled}
          keyboardType="phone-pad"
          autoFocus={autoFocus}
          // A little slack over the 10 digits so paste of a full +234… number
          // still lands; toNationalNumber trims it back.
          maxLength={PHONE_NSN_LENGTH + 4}
          textContentType="telephoneNumber"
          autoComplete="tel"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  label: { ...type.label, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.base,
    minHeight: 56,
    overflow: 'hidden',
  },
  fieldError: { borderColor: colors.danger },
  prefix: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySubtle,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: colors.border,
  },
  prefixText: { ...type.subheading, color: colors.primaryDark },
  input: {
    flex: 1,
    ...type.body,
    fontSize: 18,
    letterSpacing: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  error: { ...type.caption, color: colors.danger, marginTop: spacing.xs },
}));
