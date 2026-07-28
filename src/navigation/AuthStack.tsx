import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OtpScreen } from '@/screens/auth/OtpScreen';
import { PhoneEntryScreen } from '@/screens/auth/PhoneEntryScreen';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { ROUTES } from './routes';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
      <Stack.Screen name={ROUTES.PHONE_ENTRY} component={PhoneEntryScreen} />
      <Stack.Screen name={ROUTES.OTP} component={OtpScreen} />
    </Stack.Navigator>
  );
}
