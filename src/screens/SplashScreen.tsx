import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions, Animated, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

export const SplashScreen = () => {
  const navigation = useNavigation<any>();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.replace('PhoneInput');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.gradient}
      />
      
      {/* Background Decorative Element */}
      <View style={styles.circleDecorator} />

      <View style={styles.content}>
        <Animated.View style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }] 
          }
        ]}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../assets/logo-main.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>
          <Text style={styles.brandName}>AIKO</Text>
          <Text style={styles.tagline}>Smart Delivery & Ride Hailing</Text>
        </Animated.View>

        <Animated.View style={[
          styles.footer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <View style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Get Started</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.version}>Version 2.0.4</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  circleDecorator: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.15,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    backgroundColor: '#FFF',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  version: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
});
