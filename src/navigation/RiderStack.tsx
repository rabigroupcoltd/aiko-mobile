import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PendingApprovalScreen } from '@/screens/rider/PendingApprovalScreen';
import { RiderHomeScreen } from '@/screens/rider/RiderHomeScreen';
import { useAppStore } from '@/store/appStore';
import { ROUTES } from './routes';
import type { RiderStackParamList } from './types';

const Stack = createNativeStackNavigator<RiderStackParamList>();

/**
 * Riders see one of two dashboards depending on approval status.
 *
 * Only the applicable screen is registered, so an unapproved rider cannot
 * reach the rider home by any navigation path — it does not exist for them.
 */
export function RiderStack() {
  const approved = useAppStore((s) => s.verificationStatus === 'approved');

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {approved ? (
        <Stack.Screen name={ROUTES.RIDER_HOME} component={RiderHomeScreen} />
      ) : (
        <Stack.Screen name={ROUTES.PENDING_APPROVAL} component={PendingApprovalScreen} />
      )}
    </Stack.Navigator>
  );
}
