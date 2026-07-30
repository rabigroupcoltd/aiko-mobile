import type { ExpoConfig } from 'expo/config';

/**
 * Aiko — dispatch/delivery demo app (Minna, Niger State).
 *
 * Expo CLI loads `.env` into process.env automatically before evaluating this
 * file, so the Google Maps key below comes from `.env` (git-ignored).
 * See `.env.example`.
 */
const googleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

const config: ExpoConfig = {
  name: 'Aiko',
  slug: 'Aiko',
  scheme: 'aiko',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  // NOTE: the New Architecture is required by the Nitro modules VisionCamera v5
  // is built on. It is enabled by default in SDK 57, so there is no
  // `newArchEnabled` flag here — setting it is no longer a valid config key.

  ios: {
    supportsTablet: false,
    // Matches the app registered in the Firebase project (aiko-7874b).
    bundleIdentifier: 'com.aiko.app',
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      NSCameraUsageDescription:
        'Aiko uses the camera to take your profile photo, verify that you are a real person, and capture your documents.',
      // NSMicrophoneUsageDescription intentionally omitted — we never record audio.
      // NSPhotoLibraryUsageDescription intentionally omitted — there is no gallery
      // picker anywhere in this app; all capture is camera-only by design.
    },
  },

  android: {
    // MUST match the package registered in google-services.json, or the Google
    // Services Gradle plugin fails the build outright.
    package: 'com.aiko.app',
    googleServicesFile: './google-services.json',
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: '#0E8F4E',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['android.permission.CAMERA'],
    // VisionCamera's manifest can merge RECORD_AUDIO in, which would show a
    // microphone prompt on a delivery app. We never use audio, so block it.
    // The media/storage permissions are blocked to structurally enforce the
    // "camera-only, no gallery" requirement.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_EXTERNAL_STORAGE',
    ],
    // `android.config.googleMaps.apiKey` is a built-in Expo config field.
    // Prebuild injects it into AndroidManifest.xml as com.google.android.geo.API_KEY.
    // react-native-maps ships no config plugin of its own, so this is the route.
    ...(googleMapsApiKey
      ? { config: { googleMaps: { apiKey: googleMapsApiKey } } }
      : {}),
  },

  web: {
    favicon: './assets/favicon.png',
  },

  extra: {
    eas: {
      projectId: '4c6c28f1-6fbc-4f6c-a719-d26d5b627cfa',
    },
  },

  // Set explicitly rather than relying on the default: this is what lets Metro
  // resolve the `@/*` import alias from tsconfig.json. Without it every
  // `@/...` import fails to resolve at runtime, even though tsc is happy.
  experiments: {
    tsconfigPaths: true,
  },

  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          // react-native-vision-camera-face-detector requires API 26.
          // Everything else in the graph is fine at 23; without this the
          // manifest merger fails.
          minSdkVersion: 26,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          // Modules in this graph declare different Kotlin fallbacks (the face
          // detector 2.3.0, VisionCamera 2.2.21, Nitro 2.1.x); the root wins,
          // so it must be pinned once for all of them.
          //
          // 2.2.21 specifically: it is the highest version in Expo's KSPLookup
          // table (expo-modules-autolinking), i.e. the newest Kotlin Expo has a
          // tested KSP pairing for, and it matches VisionCamera's own default.
          // Going to 2.3.0 falls off that table into an untested branch and
          // crashes react-native-safe-area-context's Kotlin compile with an
          // internal compiler error. Do not raise this without checking
          // KSPLookup.kt first.
          kotlinVersion: '2.2.21',
          // ndkVersion deliberately NOT pinned — we use RN 0.86's default,
          // which is already installed locally. Only pin if the build fails.
        },
        // iOS values are here for completeness; this demo is built on Windows
        // and therefore Android-only. 16.4 is SDK 57's minimum.
        ios: {
          deploymentTarget: '16.4',
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
        backgroundColor: '#0E8F4E',
        imageWidth: 180,
      },
    ],
    '@react-native-google-signin/google-signin',
    // Required: `npx expo install` could not add this itself because this config
    // is a dynamic .ts file. The plugin pins the Android Material dependency the
    // date dialog is built on.
    '@react-native-community/datetimepicker',
    // NOTE: there is deliberately NO 'react-native-vision-camera' plugin entry.
    // VisionCamera v5 dropped its Expo config plugin; adding one fails prebuild
    // with "does not contain a valid config plugin". Its native permissions come
    // from the raw ios.infoPlist / android.permissions keys above instead.
  ],
};

export default config;
