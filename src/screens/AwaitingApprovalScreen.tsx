import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Clock, CheckCircle, ShieldCheck, HelpCircle } from 'lucide-react-native';
import { COLORS } from '../theme';

export const AwaitingApprovalScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Clock size={80} color={COLORS.primary} strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>Account Under Review</Text>
        <Text style={styles.subtitle}>
          Your documents are being verified by our team. This usually takes 24-48 hours. We'll notify you once you're cleared to go online.
        </Text>

        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <CheckCircle size={20} color="#2E7D32" />
            <Text style={styles.stepText}>Documents Uploaded</Text>
          </View>
          <View style={styles.stepItem}>
            <Clock size={20} color={COLORS.primary} />
            <Text style={[styles.stepText, { fontWeight: '700', color: COLORS.text }]}>Verification in Progress</Text>
          </View>
          <View style={styles.stepItem}>
            <ShieldCheck size={20} color="#BDBDBD" />
            <Text style={[styles.stepText, { color: '#BDBDBD' }]}>Background Check</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => {/* Support logic */}}
        >
          <HelpCircle size={20} color={COLORS.text} />
          <Text style={styles.supportText}>Need Help? Contact Support</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  supportText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    padding: 24,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
