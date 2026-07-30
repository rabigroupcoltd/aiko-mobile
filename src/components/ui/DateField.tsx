import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { makeStyles, radius, spacing } from '@/theme';
import { formatDateForDisplay } from '@/utils/date';

interface DateFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Where the dialog starts when the field is still empty. */
  defaultDate?: Date;
  containerStyle?: ViewStyle;
  testID?: string;
}

/**
 * Date entry backed by the system date dialog.
 *
 * Deliberately styled to match `TextField` — same label, box, focus-free border
 * and error/helper slot — so a form can mix the two without looking assembled
 * from parts. It is a `Pressable` rather than a `TextInput`: there is no free
 * text to type, which also means no keyboard, no input masking and no way to
 * enter 31/02/1990.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  helper,
  placeholder = 'DD/MM/YYYY',
  minimumDate,
  maximumDate,
  defaultDate,
  containerStyle,
  testID,
}: DateFieldProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[styles.field, !!error && styles.fieldError]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ? formatDateForDisplay(value) : placeholder }}
        testID={testID}>
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? formatDateForDisplay(value) : placeholder}
        </Text>
      </Pressable>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}

      {open ? (
        <DateTimePicker
          value={value ?? defaultDate ?? maximumDate ?? new Date()}
          mode="date"
          // The three-wheel spinner, not the calendar grid. A calendar opens on
          // the current month, which is 400-odd swipes from a plausible birth
          // year; the spinner lets the year be set directly.
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          // The split callbacks, not the older single `onChange` — that one is
          // deprecated in v9 and logs a warning on every open. Both paths have
          // to unmount the picker: on Android the dialog *is* the mounted
          // component, so leaving it up makes it reopen immediately.
          onValueChange={(_event, selected) => {
            setOpen(false);
            onChange(selected);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </View>
  );
}

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
    paddingVertical: spacing.md,
  },
  fieldError: { borderColor: colors.danger },
  text: { ...type.body, flex: 1 },
  placeholder: { color: colors.textDisabled },
  error: { ...type.caption, color: colors.danger, marginTop: spacing.xs },
  helper: { ...type.caption, marginTop: spacing.xs },
}));
