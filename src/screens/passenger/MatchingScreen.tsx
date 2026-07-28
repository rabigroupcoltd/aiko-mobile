import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Text, View } from 'react-native';

import { MatchingAnimation } from '@/components/booking/MatchingAnimation';
import { Button, Screen } from '@/components/ui';
import { useFakeMatching } from '@/hooks/useFakeMatching';
import { ROUTES } from '@/navigation/routes';
import type { PassengerStackParamList } from '@/navigation/types';
import { useBookingStore } from '@/store/bookingStore';
import { makeStyles, spacing } from '@/theme';
import type { MockRider } from '@/types/models';

type Props = NativeStackScreenProps<PassengerStackParamList, typeof ROUTES.MATCHING>;

export function MatchingScreen({ navigation, route }: Props) {
  const styles = useStyles();
  const { pickup, dropoff } = route.params;
  const setMatchedRider = useBookingStore((s) => s.setMatchedRider);

  const handleMatched = useCallback(
    (rider: Omit<MockRider, 'avatar'>) => {
      setMatchedRider(rider);
      navigation.replace(ROUTES.RIDER_FOUND, { pickup, dropoff, riderId: rider.id });
    },
    [navigation, pickup, dropoff, setMatchedRider]
  );

  const { stageIndex, stages } = useFakeMatching(true, undefined, handleMatched);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Finding you a rider</Text>
          <Text style={styles.route} numberOfLines={2}>
            {pickup.name} → {dropoff.name}
          </Text>
        </View>

        <MatchingAnimation stages={stages} stageIndex={stageIndex} />

        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(({ type }) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  header: { alignItems: 'center', gap: spacing.xs },
  title: { ...type.title, textAlign: 'center' },
  route: { ...type.bodySmall, textAlign: 'center', maxWidth: 300 },
}));
