import type { ExpoConfig } from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

const googleMapsIosApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY;

const notifeeMavenRepo = require
  .resolve('@notifee/react-native/package.json')
  .replace(/[\\/]package\.json$/, '/android/libs')
  .replace(/\\/g, '/');

const config: ExpoConfig = {
  name: 'Aiko',
  slug: 'Aiko',
  scheme: 'aiko',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',

  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.aiko.app',
    googleServicesFile: './GoogleService-Info.plist',
    config: { usesNonExemptEncryption: false },
    entitlements: { 'aps-environment': 'development' },
    infoPlist: {
      NSCameraUsageDescription:
        'Aiko uses the camera to take your profile photo, verify that you are a real person, and capture your documents.',
      NSLocationWhenInUseUsageDescription:
        'Aiko uses your location to set your pickup point and, for riders, to send you orders nearby.',
      UIBackgroundModes: ['remote-notification'],
    },
  },

  android: {
    package: 'com.aiko.app',
    googleServicesFile: './google-services.json',
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: '#0D8A41',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
    ],
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_EXTERNAL_STORAGE',
    ],
    ...(googleMapsApiKey
      ? { config: { googleMaps: { apiKey: googleMapsApiKey } } }
      : {}),
  },

  web: {
    favicon: './assets/favicon.png',
  },

  extra: {
    iosGoogleMaps: Boolean(googleMapsIosApiKey),
    eas: {
      projectId: '4c6c28f1-6fbc-4f6c-a719-d26d5b627cfa',
    },
  },

  experiments: {
    tsconfigPaths: true,
  },

  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          kotlinVersion: '2.2.21',
          extraMavenRepos: [notifeeMavenRepo],
        },
        ios: {
          deploymentTarget: '16.4',
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBMessaging'],
        },
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Aiko needs your camera to capture your photo and documents.',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        backgroundColor: '#0D8A41',
        imageWidth: 180,
      },
    ],
    [
      'react-native-document-scanner-plugin',
      {
        cameraPermission:
          'Aiko uses the camera to scan your driver’s licence and ID.',
      },
    ],
    '@react-native-google-signin/google-signin',
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Aiko sends your location to the dispatcher while you are online so orders near you can reach you, even when the app is in the background.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        isIosBackgroundLocationEnabled: true,
      },
    ],
    ...(googleMapsIosApiKey
      ? [['react-native-maps', { iosGoogleMapsApiKey: googleMapsIosApiKey }] as [string, object]]
      : []),
    '@react-native-community/datetimepicker',
  ],
};

export default config;
