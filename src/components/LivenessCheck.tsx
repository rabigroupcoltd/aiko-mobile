import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ScanFace, CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';

interface LivenessCheckProps {
  verified: boolean;
  onVerify: () => void;
}

export const LivenessCheck = ({ verified, onVerify }: LivenessCheckProps) => {
  const [scanning, setScanning] = useState(false);

  const handlePress = () => {
    if (verified || scanning) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onVerify();
    }, 1800);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Identity Verification</Text>
      <TouchableOpacity
        style={[styles.circle, verified && styles.circleDone]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {verified ? (
          <CheckCircle size={36} color={COLORS.primary} />
        ) : scanning ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <ScanFace size={36} color={COLORS.primary} />
        )}
      </TouchableOpacity>
      <Text style={styles.statusText}>
        {verified
          ? 'Liveness check passed'
          : scanning
          ? 'Scanning your face...'
          : 'Tap to start liveness check'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  circleDone: {
    borderStyle: 'solid',
    backgroundColor: COLORS.primary + '08',
  },
  statusText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
