import { createDrawerNavigator } from '@react-navigation/drawer';

import { DrawerContent } from '@/components/drawer/DrawerContent';
import { useOnboardingState } from '@/modules/onboarding/onboardingController';
import { MyDocumentsScreen } from '@/screens/common/MyDocumentsScreen';
import { OrderHistoryScreen } from '@/screens/common/OrderHistoryScreen';
import { ProfileScreen } from '@/screens/common/ProfileScreen';
import { SettingsScreen } from '@/screens/common/SettingsScreen';
import { DriverEarningsScreen } from '@/screens/rider/DriverEarningsScreen';
import { useTheme } from '@/theme';
import { PassengerStack } from './PassengerStack';
import { RiderStack } from './RiderStack';
import { ROUTES } from './routes';
import type { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

export function AppDrawer() {
  const onboarding = useOnboardingState();
  const { colors } = useTheme();
  const isRider = onboarding?.accountType === 'RIDER';

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
