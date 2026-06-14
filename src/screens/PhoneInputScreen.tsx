import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Phone, Tag } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const PhoneInputScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [phone, setPhone] = useState('');
  const [referral, setReferral] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={COLORS.black} size={28} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Enter your phone number</Text>
            <Text style={styles.subtitle}>We'll send you a 6-digit verification code</Text>
          </View>

          <View style={styles.form}>
            <Input 
              label="Phone Number" 
              placeholder="800 000 0000" 
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              icon={<Phone size={20} color={COLORS.textMuted} />}
            />

            <Input 
              label="Referral Code (Optional)" 
              placeholder="Enter code" 
              value={referral}
              onChangeText={setReferral}
              autoCapitalize="characters"
              icon={<Tag size={20} color={COLORS.textMuted} />}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Continue" 
            onPress={() => navigation.navigate('OTP', { phone, role: route.params?.role })} 
            disabled={phone.length < 10}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
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
  content: {
    flex: 1,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  form: {
    marginTop: SPACING.lg,
  },
  footer: {
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
});
