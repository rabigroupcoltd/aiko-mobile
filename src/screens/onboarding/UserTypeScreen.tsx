import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppHeader, Button, Screen, SelectableCard, StepDots } from '@/components/ui';
import { ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { ONBOARDING_TOTAL_STEPS } from '@/store/selectors';
import { makeStyles, radius, spacing } from '@/theme';
import type { Role } from '@/types/models';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.USER_TYPE>;

export function UserTypeScreen({ navigation }: Props) {
  const styles = useStyles();
  const setRole = useAppStore((s) => s.setRole);
  const [selected, setSelected] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setRole(selected);

    if (selected === 'rider') {
      navigation.navigate(ROUTES.LICENSE_CAPTURE);
    }
    // Passengers need no further steps — setting the role completes onboarding
    // and the root switch swaps in the drawer on the next render.
  };

  return (
    <Screen
      scroll
      footer={
        <Button label="Continue" onPress={handleContinue} disabled={!selected} />
      }>
      <AppHeader
        onBack={() => navigation.goBack()}
        title="How will you use Aiko?"
        subtitle="You can switch this later in your settings."
        trailing={<StepDots total={ONBOARDING_TOTAL_STEPS} current={3} />}
      />

      <View style={styles.cards}>
        <SelectableCard
          icon="🧍"
          title="Passenger"
          description="Book bikes and keke to get around Minna."
          selected={selected === 'passenger'}
          onPress={() => setSelected('passenger')}
          testID="user-type-passenger"
        />
        <SelectableCard
          icon="🏍️"
          title="Rider"
          description="Earn by carrying passengers and parcels."
          meta="Verification required"
          selected={selected === 'rider'}
          onPress={() => setSelected('rider')}
          testID="user-type-rider"
        />
      </View>

      {selected === 'rider' ? (
        <View style={styles.note}>
          <Text style={styles.noteTitle}>What you&apos;ll need</Text>
          <Text style={styles.noteBody}>
            A valid driver&apos;s licence, your national ID, and a photo of your vehicle
            plate number. It takes about two minutes.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, type }) => ({
  cards: { gap: spacing.md },
  note: {
    marginTop: spacing.lg,
    padding: spacing.base,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.base,
    gap: spacing.xs,
  },
  noteTitle: { ...type.label, color: colors.primaryDarker },
  noteBody: type.bodySmall,
}));
