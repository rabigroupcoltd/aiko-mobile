import { useCallback } from 'react';
import { Alert } from 'react-native';

import { SwitchModeManager, useOnboardingState } from '@/modules/onboarding/onboardingController';
import type { AccountType } from '@/modules/shared/apiTypes';
import { stopBackgroundLocation } from '@/services/backgroundLocation';
import { haptics } from '@/utils/haptics';
import showToast from '@/utils/toast';

export type ModeTarget = {
  accountType: AccountType;
  /** What the switch row says, given where the user stands. */
  title: string;
  subtitle: string;
};

/**
 * Switching between ordering and riding. One person can do both: a rider can
 * send their own parcel, and a customer can apply to ride. The first switch to
 * riding starts the rider application (documents, then admin approval).
 */
export function useSwitchMode() {
  const onboarding = useOnboardingState();
  const { switchMode, isLoading } = SwitchModeManager();

  const isRider = onboarding?.accountType === 'RIDER';
  const status = onboarding?.driver.status ?? 'NOT_APPLICABLE';

  const target: ModeTarget = isRider
    ? {
        accountType: 'PASSENGER',
        title: 'Switch to ordering',
        subtitle: 'Send a package yourself',
      }
    : status === 'APPROVED'
      ? { accountType: 'RIDER', title: 'Switch to riding', subtitle: 'Go online and take orders' }
      : status === 'PENDING'
        ? { accountType: 'RIDER', title: 'Rider application', subtitle: 'Waiting for approval' }
        : status === 'REJECTED'
          ? { accountType: 'RIDER', title: 'Rider application', subtitle: 'Needs changes — tap to update' }
          : { accountType: 'RIDER', title: 'Become a rider', subtitle: 'Earn with your bike or keke' };

  const perform = useCallback(
    async (accountType: AccountType) => {
      try {
        const next = await switchMode(accountType);
        haptics.success();
        if (accountType === 'PASSENGER') {
          // Ordering mode must not keep reporting the user's location.
          await stopBackgroundLocation();
          showToast.success("You're in ordering mode");
        } else if (next.driver.status === 'APPROVED') {
          showToast.success("You're in rider mode — go online to get orders");
        }
        return true;
      } catch (e: any) {
        haptics.error();
        Alert.alert("Couldn't switch", e?.message || 'Please try again.');
        return false;
      }
    },
    [switchMode],
  );

  /** Asks first where the switch has consequences, then switches. */
  const requestSwitch = useCallback(() => {
    if (target.accountType === 'PASSENGER') {
      Alert.alert(
        'Switch to ordering?',
        "You'll go offline and stop getting delivery requests. Switch back any time from the menu.",
        [
          { text: 'Stay riding', style: 'cancel' },
          { text: 'Switch', onPress: () => void perform('PASSENGER') },
        ],
      );
      return;
    }

    if (status === 'NOT_APPLICABLE' || status === 'NOT_SUBMITTED') {
      Alert.alert(
        'Become an Aiko rider',
        "You'll scan your national ID and vehicle plate, and add your driver's licence if you have one. Our team reviews them and lets you know when you can start riding. You can keep ordering while you wait.",
        [
          { text: 'Not now', style: 'cancel' },
          { text: "Let's go", onPress: () => void perform('RIDER') },
        ],
      );
      return;
    }

    void perform('RIDER');
  }, [perform, status, target.accountType]);

  return { target, requestSwitch, switchTo: perform, switching: isLoading, isRider, status };
}
