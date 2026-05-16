import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SplashScreen } from '../screens/SplashScreen';
import { PhoneInputScreen } from '../screens/PhoneInputScreen';
import { OTPScreen } from '../screens/OTPScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { DriverOnboardingScreen } from '../screens/DriverOnboardingScreen';
import { SuccessScreen } from '../screens/SuccessScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { OrderAcceptanceScreen } from '../screens/OrderAcceptanceScreen';
import { GoOnlineScreen } from '../screens/GoOnlineScreen';
import { OrderListScreen } from '../screens/OrderListScreen';
import { OrderViewScreen } from '../screens/OrderViewScreen';
import { UpdateOrderStatusScreen } from '../screens/UpdateOrderStatusScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { NotificationScreen } from '../screens/NotificationScreen';
import { AnnouncementScreen } from '../screens/AnnouncementScreen';
import { AwaitingApprovalScreen } from '../screens/AwaitingApprovalScreen';
import { MainDrawer } from './MainDrawer';
import { HelpCenterScreen } from '../screens/HelpCenterScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      {/* Auth / Onboarding */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="DriverOnboarding" component={DriverOnboardingScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="AwaitingApproval" component={AwaitingApprovalScreen} />

      {/* Main app */}
      <Stack.Screen name="Main" component={MainDrawer} />

      {/* Standalone Screens */}
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="GoOnline" component={GoOnlineScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="Announcements" component={AnnouncementScreen} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      
      {/* Operational screens */}
      <Stack.Screen name="OrderAcceptance" component={OrderAcceptanceScreen} />
      <Stack.Screen name="OrderList" component={OrderListScreen} />
      <Stack.Screen name="OrderView" component={OrderViewScreen} />
      <Stack.Screen name="UpdateOrderStatus" component={UpdateOrderStatusScreen} />
    </Stack.Navigator>
  );
};
