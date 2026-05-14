import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { COLORS, SIZES, SPACING } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}


export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'right'
}: ButtonProps) => {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        isOutline && styles.outlineButton,
        isGhost && styles.ghostButton,
        disabled && styles.disabledButton,
        style,
        { flexDirection: 'row' }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? COLORS.primary : COLORS.white} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={{ marginRight: title ? 8 : 0 }}>{icon}</View>}
          {title ? (
            <Text
              style={[
                styles.text,
                isOutline || isGhost ? styles.outlineText : styles.primaryText,
                disabled && styles.disabledText,
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
          {icon && iconPosition === 'right' && <View style={{ marginLeft: title ? 8 : 0 }}>{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  button: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    paddingHorizontal: SPACING.lg,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
});
