import { StyleSheet, Text, View } from 'react-native';

import { green } from '@/theme';
import { AikoMark } from './AikoMark';

interface AikoLogoProps {
  size?: number;
  tone?: 'onBrand' | 'onLight';
  stacked?: boolean;
}

export function AikoLogo({ size = 56, tone = 'onBrand', stacked = false }: AikoLogoProps) {
  const wordColor = tone === 'onBrand' ? '#FFFFFF' : green[900];

  return (
    <View style={[styles.row, stacked && styles.stacked, { gap: size * (stacked ? 0.22 : 0.26) }]}>
      <AikoMark size={size} variant="tile" />
      <Text
        style={[
          styles.word,
          { fontSize: size * (stacked ? 0.78 : 0.72), lineHeight: size * 0.95, color: wordColor },
        ]}
        accessibilityRole="header">
        aiko
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  stacked: { flexDirection: 'column' },
  word: {
    fontWeight: '800',
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
});
