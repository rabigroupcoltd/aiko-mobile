import { createDrawerNavigator } from '@react-navigation/drawer';

import { DrawerContent } from '@/components/drawer/DrawerContent';
import { MyDocumentsScreen } from '@/screens/common/MyDocumentsScreen';
import { OrderHistoryScreen } from '@/screens/common/OrderHistoryScreen';
import { ProfileScreen } from '@/screens/common/ProfileScreen';
import { SettingsScreen } from '@/screens/common/SettingsScreen';
import { DriverEarningsScreen } from '@/screens/rider/DriverEarningsScreen';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme';
import { PassengerStack } from './PassengerStack';
import { RiderStack } from './RiderStack';
import { ROUTES } from './routes';
import type { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

/**
 * Post-login shell.
 *
 * The home screen and the document entry differ by role. Booking routes are
 * simply not registered for riders, so they are unreachable rather than merely
 * hidden from the menu.
 */
export function AppDrawer() {
  const role = useAppStore((s) => s.role);
  const { colors } = useTheme();
  const isRider = role === 'rider';

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 300, backgroundColor: colors.surface },
        swipeEdgeWidth: 60,
      }}>
      <Drawer.Screen
        name={ROUTES.HOME_TAB}
        component={isRider ? RiderStack : PassengerStack}
      />
      <Drawer.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
      {/* Shared: a customer reads what they paid, a driver what they kept. */}
      <Drawer.Screen name={ROUTES.ORDER_HISTORY} component={OrderHistoryScreen} />
      {isRider ? (
        <>
          <Drawer.Screen name={ROUTES.DRIVER_EARNINGS} component={DriverEarningsScreen} />
          <Drawer.Screen name={ROUTES.MY_DOCUMENTS} component={MyDocumentsScreen} />
        </>
      ) : null}
      <Drawer.Screen name={ROUTES.SETTINGS} component={SettingsScreen} />
    </Drawer.Navigator>
  );
}
