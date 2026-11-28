import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import { SelfieCapture } from '@/components/liveness/SelfieCapture';
import AxiosWithToken from '@/constants/api_management/MyHttpHelperWithToken';
import type { AuthProfile } from '@/modules/auth/authTypes';
import {
  UpdateOnboardingManager,
  UploadOnboardingPhotoManager,
} from '@/modules/onboarding/onboardingController';
import type { ApiResponse } from '@/modules/shared/apiTypes';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { createLogger } from '@/utils/logger';
import showToast from '@/utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PROFILE_PHOTO>;

const log = createLogger('profilePhoto');

/**
 * Changing the profile photo runs the same live selfie check as sign-up, so
 * the new photo is always of the person holding the phone — not a picture of
 * someone else. Passing it re-stamps the account's liveness check.
 */
export function ProfilePhotoScreen({ navigation }: Props) {
  const { uploadPhoto } = UploadOnboardingPhotoManager();
  const { updateOnboarding } = UpdateOnboardingManager();
  const setAsset = useAppStore((s) => s.setAsset);
  const setUser = useAuthStore((s) => s.setUser);

  const save = useCallback(
    async (uri: string) => {
      await uploadPhoto({ uri, name: `profile-${Date.now()}.jpg`, type: 'image/jpeg' });
      await updateOnboarding({ livenessPassed: true });

      try {
        const response = await AxiosWithToken.get<ApiResponse<AuthProfile>>('/auth/profile');
        const { driver: _driver, onboarding: _onboarding, ...user } = response.data.data;
        setUser(user);
      } catch (error) {
        // The upload succeeded; the local copy below covers the display.
        log.warn('could not refresh the profile after a photo change', error);
      }

      await setAsset('profile', { uri, width: 0, height: 0 }).catch(() => undefined);
      showToast.success('Profile photo updated');
      navigation.goBack();
    },
    [navigation, setAsset, setUser, updateOnboarding, uploadPhoto],
  );

  return (
    <SelfieCapture
      title="New profile photo"
      confirmLabel="Use this photo"
      onConfirm={save}
      onBack={() => navigation.goBack()}
    />
  );
}
