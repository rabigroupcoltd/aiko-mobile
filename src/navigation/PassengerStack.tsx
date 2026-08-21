import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OrderChatScreen } from '@/screens/common/OrderChatScreen';
import { HomeScreen } from '@/screens/passenger/HomeScreen';
import { MatchingScreen } from '@/screens/passenger/MatchingScreen';
import { OrderReviewScreen } from '@/screens/passenger/OrderReviewScreen';
import { RiderFoundScreen } from '@/screens/passenger/RiderFoundScreen';
import { ROUTES } from './routes';
import type { PassengerStackParamList } from './types';

const Stack = createNativeStackNavigator<PassengerStackParamList>();

export function PassengerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.PASSENGER_HOME} component={HomeScreen} />
      <Stack.Screen name={ROUTES.ORDER_REVIEW} component={OrderReviewScreen} />
      {/*
        The bid flow is still reachable and still works — the marketplace is a
        layer on top of it, not a replacement. Home now leads to OrderReview
        instead, which is the flow §43 describes.
      */}
      <Stack.Screen
        name={ROUTES.MATCHING}
        component={MatchingScreen}
        // Fading into the matching screen keeps attention on the radar
        // animation rather than a lateral slide.
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name={ROUTES.RIDER_FOUND}
        component={RiderFoundScreen}
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
      <Stack.Screen name={ROUTES.ORDER_CHAT} component={OrderChatScreen} />
    </Stack.Navigator>
  );
}
