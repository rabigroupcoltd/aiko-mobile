import googleServices from '../../google-services.json';

const ANDROID_PACKAGE = 'com.nuriq.aiko';
const client =
  googleServices.client.find((c) => c.client_info.android_client_info.package_name === ANDROID_PACKAGE) ??
  googleServices.client[0];
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? googleServices.project_info.project_id;

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? client.api_key[0].current_key,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: googleServices.project_info.storage_bucket,
  messagingSenderId: googleServices.project_info.project_number,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? client.client_info.mobilesdk_app_id,
} as const;
