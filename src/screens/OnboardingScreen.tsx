import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Camera, MapPin, Bell, Landmark, User, CreditCard } from 'lucide-react-native';
import { COLORS, SPACING, SIZES } from '../theme';
import { Button } from '../components/Button';

const PASSENGER_STEPS = [
  { id: 'PROFILE', title: 'Personal Info', subtitle: 'Tell us a bit about yourself' },
  { id: 'ADDRESS', title: 'Your Address', subtitle: 'Where should we pick you up?' },
  { id: 'NOTIFICATIONS', title: 'Stay Updated', subtitle: 'How should we contact you?' },
];

const DRIVER_STEPS = [
  { id: 'IDENTITY', title: 'Identity', subtitle: 'Verify your identification' },
  { id: 'VEHICLE', title: 'Vehicle Info', subtitle: 'Tell us about your ride' },
  { id: 'BANK', title: 'Payment', subtitle: 'Where should we send your earnings?' },
];

export const OnboardingScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const flow = route.params?.flow || 'PASSENGER';
  const steps = flow === 'PASSENGER' ? PASSENGER_STEPS : DRIVER_STEPS;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];

  const [formData, setFormData] = useState<any>({});

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      navigation.navigate('Success');
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'PROFILE':
        return (
          <View style={styles.form}>
            <Input label="Full Name" placeholder="John Doe" icon={<User size={20} color={COLORS.textMuted} />} />
            <Input label="Phone Number" placeholder="+234 800 000 0000" keyboardType="phone-pad" />
          </View>
        );
      case 'ADDRESS':
        return (
          <View style={styles.form}>
            <Input label="Home Address" placeholder="123 Luxury Street, Lagos" icon={<MapPin size={20} color={COLORS.textMuted} />} />
            <Input label="Work Address (Optional)" placeholder="Business District, Lagos" />
          </View>
        );
      case 'NOTIFICATIONS':
        return (
          <View style={styles.form}>
             <Text style={styles.infoText}>We'll send you updates about your rides and exclusive offers.</Text>
             <NotificationOption title="Push Notifications" active />
             <NotificationOption title="Email Updates" active />
             <NotificationOption title="SMS Alerts" />
          </View>
        );
      case 'IDENTITY':
        return (
          <View style={styles.form}>
            <View style={styles.uploadBox}>
                <Camera size={32} color={COLORS.primary} />
                <Text style={styles.uploadText}>Upload ID Card / Passport</Text>
            </View>
            <Input label="ID Number" placeholder="A1234567" />
          </View>
        );
      case 'VEHICLE':
        return (
          <View style={styles.form}>
            <Input label="Vehicle Model" placeholder="Toyota Corolla 2022" icon={<CreditCard size={20} color={COLORS.textMuted} />} />
            <Input label="Plate Number" placeholder="LND-123-ABC" />
            <Input label="Color" placeholder="Silver Metallic" />
          </View>
        );
      case 'BANK':
        return (
          <View style={styles.form}>
            <Input label="Bank Name" placeholder="Select Bank" icon={<Landmark size={20} color={COLORS.textMuted} />} />
            <Input label="Account Number" placeholder="0123456789" keyboardType="number-pad" />
            <Input label="Account Name" placeholder="John Doe" editable={false} />
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft color={COLORS.black} size={28} />
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${((currentStepIndex + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleSection}>
            <Text style={styles.stepIndicator}>Step {currentStepIndex + 1} of {steps.length}</Text>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
          </View>

          {renderStepContent()}
        </ScrollView>

        <View style={styles.footer}>
          <Button 
            title={currentStepIndex === steps.length - 1 ? "Finish" : "Next Step"} 
            onPress={handleNext} 
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Input = ({ label, placeholder, icon, ...props }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      {icon && <View style={styles.inputIcon}>{icon}</View>}
      <TextInput 
        style={styles.input} 
        placeholder={placeholder} 
        placeholderTextColor={COLORS.textMuted}
        {...props} 
      />
    </View>
  </View>
);

const NotificationOption = ({ title, active }: any) => (
    <TouchableOpacity style={[styles.option, active && styles.optionActive]}>
        <Text style={[styles.optionText, active && styles.optionTextActive]}>{title}</Text>
        <View style={[styles.toggle, active && styles.toggleActive]}>
            <View style={[styles.toggleCircle, active && styles.toggleCircleActive]} />
        </View>
    </TouchableOpacity>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
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
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  form: {
    gap: SPACING.lg,
  },
  inputContainer: {
    gap: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  footer: {
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.lg,
      backgroundColor: COLORS.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.border,
  },
  optionActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary + '05',
  },
  optionText: {
      fontSize: 15,
      fontWeight: '700',
      color: COLORS.text,
  },
  optionTextActive: {
      color: COLORS.primary,
  },
  toggle: {
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: COLORS.border,
      padding: 2,
  },
  toggleActive: {
      backgroundColor: COLORS.primary,
  },
  toggleCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: COLORS.white,
  },
  toggleCircleActive: {
      alignSelf: 'flex-end',
  },
  uploadBox: {
      height: 160,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: COLORS.primary,
      borderStyle: 'dashed',
      backgroundColor: COLORS.primary + '05',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
  },
  uploadText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.primary,
  }
});
