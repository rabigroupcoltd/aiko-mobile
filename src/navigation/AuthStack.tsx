import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { ROUTES } from './routes';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
    </Stack.Navigator>
  );
}
