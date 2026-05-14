import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING } from '../theme';
import { Button } from '../components/Button';

export const SuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const role = route.params?.role || 'PASSENGER';

  const handleContinue = () => {
    if (role === 'DRIVER') {
      navigation.replace('AwaitingApproval');
    } else {
      navigation.replace('Main', { role: 'PASSENGER' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color={COLORS.primary} strokeWidth={2.5} />
        </View>
        
        <Text style={styles.title}>All Set!</Text>
        <Text style={styles.subtitle}>
          Your profile has been successfully set up. {role === 'DRIVER' ? "We'll review your documents shortly." : "You can now start using Aiko."}
        </Text>

        <View style={styles.footer}>
          <Button 
            title={role === 'DRIVER' ? "Check Status" : "Go to Dashboard"} 
            onPress={handleContinue} 
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    left: SPACING.xl,
    right: SPACING.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
});
