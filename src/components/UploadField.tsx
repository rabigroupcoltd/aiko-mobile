import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Input } from './Input';

interface UploadFieldProps {
  label: string;
  placeholder?: string;
}

export const UploadField = ({ label, placeholder }: UploadFieldProps) => {
  const [uploaded, setUploaded] = useState(false);

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={styles.uploadLabel}>{label}</Text>
      {placeholder && (
        <View style={{ marginBottom: SPACING.sm }}>
          <Input label="" placeholder={placeholder} containerStyle={{ marginBottom: 0 }} />
        </View>
      )}
      <TouchableOpacity
        style={[styles.uploadArea, uploaded && styles.uploadAreaDone]}
        onPress={() => setUploaded((prev) => !prev)}
      >
        {uploaded ? (
          <>
            <CheckCircle size={24} color={COLORS.primary} />
            <Text style={styles.uploadText}>Document uploaded · Tap to replace</Text>
          </>
        ) : (
          <>
            <Camera size={24} color={COLORS.primary} />
            <Text style={styles.uploadText}>Tap to upload image</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  uploadLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uploadArea: {
    height: 140,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  uploadAreaDone: {
    borderStyle: 'solid',
    backgroundColor: COLORS.primary + '08',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
