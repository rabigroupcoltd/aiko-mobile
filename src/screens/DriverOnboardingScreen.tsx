import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Camera, Bike, User, Landmark, ShieldCheck } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

const STEPS = [
  { id: 'DOCUMENTS', title: 'Verifications', subtitle: 'Upload your identity documents' },
  { id: 'VEHICLE', title: 'Vehicle Details', subtitle: 'Tell us about your ride' },
  { id: 'NOK', title: 'Next of Kin', subtitle: 'Emergency contact information' },
  { id: 'GUARANTOR', title: 'Guarantor', subtitle: 'Verify your credibility' },
  { id: 'BANK', title: 'Payout Details', subtitle: 'Where should we send your earnings?' },
];

export const DriverOnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      navigation.navigate('Success', { role: 'DRIVER' });
    }
  };


  const renderContent = () => {
    switch (currentStep.id) {
      case 'DOCUMENTS':
        return (
          <View style={styles.form}>
            <UploadField label="Driver's License" placeholder="License Number" />
            <UploadField label="Government ID" placeholder="ID Number" />
          </View>
        );
      case 'VEHICLE':
        return (
          <View style={styles.form}>
            <Input label="Vehicle Brand" placeholder="Toyota, Honda, etc." icon={<Bike size={20} color={COLORS.textMuted} />} />
            <Input label="Plate Number" placeholder="ABC-123-XYZ" />
            <Input label="Vehicle Color" placeholder="Black" />
            <UploadField label="Vehicle Registration" />
          </View>
        );
      case 'NOK':
        return (
          <View style={styles.form}>
            <Input label="Full Name" placeholder="Contact Person" icon={<User size={20} color={COLORS.textMuted} />} />
            <Input label="Phone Number" placeholder="+234..." keyboardType="phone-pad" />
            <Input label="Relationship" placeholder="Brother, Spouse, etc." />
          </View>
        );
      case 'GUARANTOR':
        return (
          <View style={styles.form}>
            <Input label="Guarantor Name" placeholder="Full Name" icon={<ShieldCheck size={20} color={COLORS.textMuted} />} />
            <Input label="Occupation" placeholder="Engineer, Trader, etc." />
            <Input label="Phone Number" placeholder="+234..." keyboardType="phone-pad" />
            <Input label="Address" placeholder="Home or Office Address" />
          </View>
        );
      case 'BANK':
        return (
          <View style={styles.form}>
            <Input label="Bank Name" placeholder="Select Bank" icon={<Landmark size={20} color={COLORS.textMuted} />} />
            <Input label="Account Number" placeholder="0123456789" keyboardType="number-pad" />
            <Input label="Account Name" placeholder="Account Holder Name" />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => currentStepIndex > 0 ? setCurrentStepIndex(currentStepIndex - 1) : navigation.goBack()} 
            style={styles.backButton}
          >
            <ChevronLeft color={COLORS.black} size={28} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i <= currentStepIndex && styles.dotActive]} />
            ))}
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>
          </View>

          {renderContent()}
        </ScrollView>

        <View style={styles.footer}>
          <Button title={currentStepIndex === STEPS.length - 1 ? "Finish Registration" : "Save & Continue"} onPress={handleNext} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const UploadField = ({ label, placeholder }: any) => (
  <View style={{ marginBottom: SPACING.lg }}>
    <Text style={styles.uploadLabel}>{label}</Text>
    {placeholder && (
      <View style={{ marginBottom: SPACING.sm }}>
        <Input label="" placeholder={placeholder} containerStyle={{ marginBottom: 0 }} />
      </View>
    )}
    <TouchableOpacity style={styles.uploadArea}>
      <Camera size={24} color={COLORS.primary} />
      <Text style={styles.uploadText}>Tap to upload image</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
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
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  titleSection: {
    marginBottom: SPACING.xxl,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  form: {
    // Gap handled by Input component
  },
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
  uploadText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
});
