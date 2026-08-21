import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useGetMyDriverProfileManager } from '@/modules/drivers/driversController';
import { OrderChatScreen } from '@/screens/common/OrderChatScreen';
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
 *
 * The server decides. `kycStatus` is what an admin actually changes, and the
 * dashboard cannot function without a server-side profile anyway — it has no
 * driver id to publish a location or set availability against. The local flag
 * is only the fallback while that request is in flight, so a rider who was
 * already approved does not flash the waiting screen on every cold start.
 */
export function RiderStack() {
  const { data: driver, isPending } = useGetMyDriverProfileManager();
  const locallyApproved = useAppStore((s) => s.verificationStatus === 'approved');

  const approved = isPending ? locallyApproved : driver?.kycStatus === 'APPROVED';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {approved ? (
        <>
          <Stack.Screen name={ROUTES.RIDER_HOME} component={RiderHomeScreen} />
          {/* Only registered for an approved rider, so an unapproved one cannot
              reach a customer conversation by any navigation path. */}
          <Stack.Screen name={ROUTES.ORDER_CHAT} component={OrderChatScreen} />
        </>
      ) : (
        <Stack.Screen name={ROUTES.PENDING_APPROVAL} component={PendingApprovalScreen} />
      )}
    </Stack.Navigator>
  );
}
