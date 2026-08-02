import googleServices from '../../google-services.json';

/**
 * Firebase client configuration, derived from `google-services.json`.
 *
 * Read from that file rather than copied out of it, so there is one source of
 * truth: re-downloading it from the Firebase console updates the JS SDK config
 * too, with nothing to keep in step by hand.
 *
 * These values are not secrets. The same file ships inside the APK — they
 * identify the project, they do not authorise anything. Access is controlled by
 * Firebase security rules and by the backend verifying the resulting token.
 *
 * Each field can still be overridden from the environment, so a staging project
 * can be pointed at without swapping the file.
 */

const client = googleServices.client[0];
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? googleServices.project_info.project_id;

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? client.api_key[0].current_key,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: googleServices.project_info.storage_bucket,
  messagingSenderId: googleServices.project_info.project_number,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? client.client_info.mobilesdk_app_id,
} as const;
