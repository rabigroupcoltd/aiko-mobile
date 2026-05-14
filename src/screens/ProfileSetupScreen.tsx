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
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, User, Mail, Calendar } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const ProfileSetupScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: ''
  });

  const handleSave = () => {
    if (route.params?.role === 'DRIVER') {
      navigation.navigate('DriverOnboarding');
    } else {
      navigation.navigate('Success', { role: 'PASSENGER' });
    }
  };


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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Create your profile</Text>
            <Text style={styles.subtitle}>Enter your details to get started</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input 
                  label="First Name" 
                  placeholder="John" 
                  value={form.firstName}
                  onChangeText={(val) => setForm({...form, firstName: val})}
                />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Input 
                  label="Last Name" 
                  placeholder="Doe" 
                  value={form.lastName}
                  onChangeText={(val) => setForm({...form, lastName: val})}
                />
              </View>
            </View>

            <Input 
              label="Email Address" 
              placeholder="john@example.com" 
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(val) => setForm({...form, email: val})}
              icon={<Mail size={20} color={COLORS.textMuted} />}
            />

            <Input 
              label="Date of Birth" 
              placeholder="DD / MM / YYYY" 
              value={form.dob}
              onChangeText={(val) => setForm({...form, dob: val})}
              icon={<Calendar size={20} color={COLORS.textMuted} />}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button 
            title="Save Profile" 
            onPress={handleSave} 
            disabled={!form.firstName || !form.lastName || !form.email}
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
  scrollContent: {
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
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  form: {
    marginTop: SPACING.md,
  },
  row: {
    flexDirection: 'row',
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
