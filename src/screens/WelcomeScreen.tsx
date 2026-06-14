import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Bike, Car } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Button } from '../components/Button';


const { width } = Dimensions.get('window');

export const WelcomeScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo-main.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitle}>Your premium delivery and transport partner</Text>
        </View>


        <View style={styles.roleContainer}>
          <Text style={styles.sectionTitle}>Select your account type</Text>
          
          <View style={styles.cardContainer}>
            <RoleCard
              title="Passenger"
              description="Ride with comfort and safety across the city"
              icon={<Car color={COLORS.primary} size={32} />}
              onPress={() => navigation.navigate('ProfileSetup', { role: 'PASSENGER' })}
            />
            <RoleCard
              title="Driver"
              description="Join our elite fleet and start earning today"
              icon={<Bike color={COLORS.primary} size={32} />}
              onPress={() => navigation.navigate('ProfileSetup', { role: 'DRIVER' })}
            />
          </View>
        </View>



      </View>
    </SafeAreaView>
  );
};

const RoleCard = ({ title, description, icon, onPress }: any) => (
  <View style={styles.card}>
    <View style={styles.cardIcon}>
      {icon}
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
    <Button
      title=""
      onPress={onPress}
      style={styles.cardButton}
      icon={<ArrowRight color="white" size={20} />}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  header: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  logoContainer: {
    marginBottom: SPACING.md,
    height: 120,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: width * 0.6,
    height: 100,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  roleContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  cardContainer: {
    gap: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  cardButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 0,
    marginLeft: SPACING.sm,
  },
  footer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
