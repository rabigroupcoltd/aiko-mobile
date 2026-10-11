import { forwardRef, useState } from 'react';
import {
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { makeStyles, radius, spacing, useTheme } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  trailing?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helper, trailing, containerStyle, style, onFocus, onBlur, ...rest },
  ref
) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.textDisabled}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles(({ colors, type }) => ({
  container: { marginBottom: spacing.base },
  label: { ...type.label, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.base,
    paddingHorizontal: spacing.base,
  },
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.danger },
  input: {
    flex: 1,
    ...type.body,
    paddingVertical: spacing.md,
  },
  trailing: { marginLeft: spacing.sm },
  error: { ...type.caption, color: colors.danger, marginTop: spacing.xs },
  helper: { ...type.caption, marginTop: spacing.xs },
}));
